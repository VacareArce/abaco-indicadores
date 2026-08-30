<?php

declare(strict_types=1);

/*
 * Construccion centralizada del cliente de BigQuery.
 *
 * Antes cada endpoint armaba este mismo bloque por su cuenta. Ademas de quitar
 * la duplicacion, aqui se enchufa el cache de token: PHP muere al terminar cada
 * request, asi que sin este cache cada visita vuelve a firmar el JWT contra
 * Google (~200-400 ms) antes de poder consultar nada.
 */

require_once __DIR__ . '/bq_cache.php';

/**
 * Credenciales que sí declaran cuándo caduca el token.
 *
 * ServiceAccountJwtAccessCredentials devuelve 'expires_in' pero nunca
 * 'expires_at', y el cache de google/auth solo entiende el segundo:
 *
 *     if (empty($cached['expires_at'])) {
 *         // If there is no expiration data, assume token is not expired.
 *         return $cached;
 *     }
 *
 * Resultado: el token se guardaba una vez y se servía para siempre. Una hora
 * después Google lo invalidaba y todas las consultas respondían 401 -- de
 * forma permanente, porque la libreria no tenia como enterarse. La propia
 * libreria lo reconoce con un TODO en FetchAuthTokenCache.
 *
 * Traducir 'expires_in' a 'expires_at' antes de que el cache lo guarde basta
 * para que la renovacion funcione sola.
 */
final class BqCredencialesConCaducidad extends Google\Auth\Credentials\ServiceAccountCredentials
{
    /**
     * FetchAuthTokenCache::updateMetadata() guarda en el cache lo que devuelve
     * getLastReceivedToken(), no lo que devuelve fetchAuthToken(). Por eso la
     * traduccion tiene que ir aqui: es el valor que termina en disco.
     */
    public function getLastReceivedToken()
    {
        return self::conCaducidad(parent::getLastReceivedToken());
    }

    public function fetchAuthToken(?callable $httpHandler = null, array $headers = [])
    {
        return self::conCaducidad(parent::fetchAuthToken($httpHandler, $headers));
    }

    /**
     * @param mixed $token
     * @return mixed
     */
    private static function conCaducidad($token)
    {
        if (!is_array($token) || !empty($token['expires_at'])) {
            return $token;
        }

        if (!empty($token['expires_in'])) {
            $token['expires_at'] = time() + (int) $token['expires_in'];

            return $token;
        }

        // getLastReceivedToken() llega sin 'expires_in', pero el propio token
        // es un JWT autofirmado y lleva su vencimiento en el claim 'exp'.
        if (!empty($token['access_token'])) {
            $exp = self::expiracionDelJwt((string) $token['access_token']);
            if ($exp !== null) {
                $token['expires_at'] = $exp;
            }
        }

        return $token;
    }

    /**
     * Lee el claim 'exp' de un JWT sin validar la firma: aqui solo interesa
     * cuando caduca, y el token lo emitimos nosotros mismos.
     */
    private static function expiracionDelJwt(string $jwt): ?int
    {
        $partes = explode('.', $jwt);
        if (count($partes) !== 3) {
            return null;
        }

        $payload = base64_decode(strtr($partes[1], '-_', '+/'), false);
        if ($payload === false) {
            return null;
        }

        $datos = json_decode($payload, true);

        return isset($datos['exp']) ? (int) $datos['exp'] : null;
    }
}

function bqClient(array $config): Google\Cloud\BigQuery\BigQueryClient
{
    $clientConfig = ['projectId' => $config['projectId']];

    if (($config['credentialsPath'] ?? '') !== '') {
        $credenciales = new BqCredencialesConCaducidad(
            [Google\Cloud\BigQuery\BigQueryClient::SCOPE],
            $config['credentialsPath']
        );

        // Conserva el JWT autofirmado: sin esto cada token exigiria un viaje
        // extra al servidor de OAuth de Google.
        $credenciales->useJwtAccessWithScope();

        $clientConfig['credentialsFetcher'] = $credenciales;
        $clientConfig['keyFilePath'] = $config['credentialsPath'];
    }

    $cacheDir = bqCacheDir($config);
    if ($cacheDir !== null) {
        $authDir = $cacheDir . '/auth';
        if (is_dir($authDir) || @mkdir($authDir, 0775, true) || is_dir($authDir)) {
            $clientConfig['authCache'] = new Google\Auth\Cache\FileSystemCacheItemPool($authDir);
        }
    }

    return new Google\Cloud\BigQuery\BigQueryClient($clientConfig);
}

/**
 * Devuelve una funcion que consulta el lastModifiedTime de la tabla.
 *
 * Es una llamada de metadata (tables.get), no un job: no factura bytes y es un
 * orden de magnitud mas barata que una consulta. Devuelve null si falla, y en
 * ese caso el cache se queda con su TTL como unico criterio.
 *
 * @return callable():?string
 */
function bqTableModifiedProvider(
    Google\Cloud\BigQuery\BigQueryClient $bigQuery,
    string $datasetId,
    string $tableName
): callable {
    return static function () use ($bigQuery, $datasetId, $tableName): ?string {
        try {
            $info = $bigQuery->dataset($datasetId)->table($tableName)->info();

            return isset($info['lastModifiedTime']) ? (string) $info['lastModifiedTime'] : null;
        } catch (Throwable $e) {
            return null;
        }
    };
}
