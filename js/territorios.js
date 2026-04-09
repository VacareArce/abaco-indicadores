function deplista(){	
	var DepMun = {
		"Amazonas":	{"El Encanto (CD)":["M91263"],"La Chorrera (CD)":["M91405"],"La Pedrera (CD)":["M91407"],"La Victoria (CD)":["M91430"],"Leticia":["M91001"],"Miriti - Paraná (CD)":["M91460"],"Puerto Alegría (CD)":["M91530"],"Puerto Arica (CD)":["M91536"],"Puerto Nariño":["M91540"],"Puerto Santander (CD)":["M91669"],"Tarapacá (CD)":["M91798"]},
		"Antioquia": {"Abejorral":["M05002"],"Abriaquí":["M05004"],"Alejandría":["M05021"],"Amagá":["M05030"],"Amalfi":["M05031"],"Andes":["M05034"],"Angelópolis":["M05036"],"Angostura":["M05038"],"Anorí":["M05040"],"Anzá":["M05044"],"Apartadó":["M05045"],"Arboletes":["M05051"],"Argelia":["M05055"],"Armenia":["M05059"],"Barbosa":["M05079"],"Bello":["M05088"],"Belmira":["M05086"],"Betania":["M05091"],"Betulia":["M05093"],"Briceño":["M05107"],"Buriticá":["M05113"],"Cáceres":["M05120"],"Caicedo":["M05125"],"Caldas":["M05129"],"Campamento":["M05134"],"Cañasgordas":["M05138"],"Caracolí":["M05142"],"Caramanta":["M05145"],"Carepa":["M05147"],"Carolina":["M05150"],"Caucasia":["M05154"],"Chigorodó":["M05172"],"Cisneros":["M05190"],"Ciudad Bolívar":["M05101"],"Cocorná":["M05197"],"Concepción":["M05206"],"Concordia":["M05209"],"Copacabana":["M05212"],"Dabeiba":["M05234"],"Donmatías":["M05237"],"Ebéjico":["M05240"],"El Bagre":["M05250"],"El Carmen de Viboral":["M05148"],"El Santuario":["M05697"],"Entrerríos":["M05264"],"Envigado":["M05266"],"Fredonia":["M05282"],"Frontino":["M05284"],"Giraldo":["M05306"],"Girardota":["M05308"],"Gómez Plata":["M05310"],"Granada":["M05313"],"Guadalupe":["M05315"],"Guarne":["M05318"],"Guatapé":["M05321"],"Heliconia":["M05347"],"Hispania":["M05353"],"Itagüí":["M05360"],"Ituango":["M05361"],"Jardín":["M05364"],"Jericó":["M05368"],"La Ceja":["M05376"],"La Estrella":["M05380"],"La Pintada":["M05390"],"La Unión":["M05400"],"Liborina":["M05411"],"Maceo":["M05425"],"Marinilla":["M05440"],"Medellín":["M05001"],"Montebello":["M05467"],"Murindó":["M05475"],"Mutatá":["M05480"],"Nariño":["M05483"],"Nechí":["M05495"],"Necoclí":["M05490"],"Olaya":["M05501"],"Peñol":["M05541"],"Peque":["M05543"],"Pueblorrico":["M05576"],"Puerto Berrío":["M05579"],"Puerto Nare":["M05585"],"Puerto Triunfo":["M05591"],"Remedios":["M05604"],"Retiro":["M05607"],"Rionegro":["M05615"],"Sabanalarga":["M05628"],"Sabaneta":["M05631"],"Salgar":["M05642"],"San Andrés de Cuerquía":["M05647"],"San Carlos":["M05649"],"San Francisco":["M05652"],"San Jerónimo":["M05656"],"San José de La Montaña":["M05658"],"San Juan de Urabá":["M05659"],"San Luis":["M05660"],"San Pedro de Los Milagros":["M05664"],"San Pedro de Urabá":["M05665"],"San Rafael":["M05667"],"San Roque":["M05670"],"San Vicente":["M05674"],"Santa Bárbara":["M05679"],"Santa Rosa de Osos":["M05686"],"Santafé de Antioquia":["M05042"],"Santo Domingo":["M05690"],"Segovia":["M05736"],"Sonsón":["M05756"],"Sopetrán":["M05761"],"Támesis":["M05789"],"Tarazá":["M05790"],"Tarso":["M05792"],"Titiribí":["M05809"],"Toledo":["M05819"],"Turbo":["M05837"],"Uramita":["M05842"],"Urrao":["M05847"],"Valdivia":["M05854"],"Valparaíso":["M05856"],"Vegachí":["M05858"],"Venecia":["M05861"],"Vigía del Fuerte":["M05873"],"Yalí":["M05885"],"Yarumal":["M05887"],"Yolombó":["M05890"],"Yondó":["M05893"],"Zaragoza":["M05895"]},
		"Arauca": {"Arauca":["M81001"],"Arauquita":["M81065"],"Cravo Norte":["M81220"],"Fortul":["M81300"],"Puerto Rondón":["M81591"],"Saravena":["M81736"],"Tame":["M81794"]},
		"Archipiélago de San Andrés": {"Providencia":["M88564"],"San Andrés":["M88001"]},
		"Atlántico": {"Baranoa":["M08078"],"Barranquilla":["M08001"],"Campo de La Cruz":["M08137"],"Candelaria":["M08141"],"Galapa":["M08296"],"Juan de Acosta":["M08372"],"Luruaco":["M08421"],"Malambo":["M08433"],"Manatí":["M08436"],"Palmar de Varela":["M08520"],"Piojó":["M08549"],"Polonuevo":["M08558"],"Ponedera":["M08560"],"Puerto Colombia":["M08573"],"Repelón":["M08606"],"Sabanagrande":["M08634"],"Sabanalarga":["M08638"],"Santa Lucía":["M08675"],"Santo Tomás":["M08685"],"Soledad":["M08758"],"Suan":["M08770"],"Tubará":["M08832"],"Usiacurí":["M08849"]},
		"Bogotá, D.C.": {"Bogotá, D.C.":["M11001"]},
		"Bolívar": {"Achí":["M13006"],"Altos del Rosario":["M13030"],"Arenal":["M13042"],"Arjona":["M13052"],"Arroyohondo":["M13062"],"Barranco de Loba":["M13074"],"Calamar":["M13140"],"Cantagallo":["M13160"],"Cartagena de Indias":["M13001"],"Cicuco":["M13188"],"Clemencia":["M13222"],"Córdoba":["M13212"],"El Carmen de Bolívar":["M13244"],"El Guamo":["M13248"],"El Peñón":["M13268"],"Hatillo de Loba":["M13300"],"Magangué":["M13430"],"Mahates":["M13433"],"Margarita":["M13440"],"María La Baja":["M13442"],"Mompós":["M13468"],"Montecristo":["M13458"],"Morales":["M13473"],"Norosí":["M13490"],"Pinillos":["M13549"],"Regidor":["M13580"],"Río Viejo":["M13600"],"San Cristóbal":["M13620"],"San Estanislao":["M13647"],"San Fernando":["M13650"],"San Jacinto":["M13654"],"San Jacinto del Cauca":["M13655"],"San Juan Nepomuceno":["M13657"],"San Martín de Loba":["M13667"],"San Pablo":["M13670"],"Santa Catalina":["M13673"],"Santa Rosa":["M13683"],"Santa Rosa del Sur":["M13688"],"Simití":["M13744"],"Soplaviento":["M13760"],"Talaigua Nuevo":["M13780"],"Tiquisio":["M13810"],"Turbaco":["M13836"],"Turbaná":["M13838"],"Villanueva":["M13873"],"Zambrano":["M13894"]},
		"Boyacá": {"Almeida":["M15022"],"Aquitania":["M15047"],"Arcabuco":["M15051"],"Belén":["M15087"],"Berbeo":["M15090"],"Betéitiva":["M15092"],"Boavita":["M15097"],"Boyacá":["M15104"],"Briceño":["M15106"],"Buenavista":["M15109"],"Busbanzá":["M15114"],"Caldas":["M15131"],"Campohermoso":["M15135"],"Cerinza":["M15162"],"Chinavita":["M15172"],"Chiquinquirá":["M15176"],"Chíquiza":["M15232"],"Chiscas":["M15180"],"Chita":["M15183"],"Chitaraque":["M15185"],"Chivatá":["M15187"],"Chivor":["M15236"],"Ciénega":["M15189"],"Cómbita":["M15204"],"Coper":["M15212"],"Corrales":["M15215"],"Covarachía":["M15218"],"Cubará":["M15223"],"Cucaita":["M15224"],"Cuítiva":["M15226"],"Duitama":["M15238"],"El Cocuy":["M15244"],"El Espino":["M15248"],"Firavitoba":["M15272"],"Floresta":["M15276"],"Gachantivá":["M15293"],"Gámeza":["M15296"],"Garagoa":["M15299"],"Guacamayas":["M15317"],"Guateque":["M15322"],"Guayatá":["M15325"],"Güicán de La Sierra":["M15332"],"Iza":["M15362"],"Jenesano":["M15367"],"Jericó":["M15368"],"La Capilla":["M15380"],"La Uvita":["M15403"],"La Victoria":["M15401"],"Labranzagrande":["M15377"],"Macanal":["M15425"],"Maripí":["M15442"],"Miraflores":["M15455"],"Mongua":["M15464"],"Monguí":["M15466"],"Moniquirá":["M15469"],"Motavita":["M15476"],"Muzo":["M15480"],"Nobsa":["M15491"],"Nuevo Colón":["M15494"],"Oicatá":["M15500"],"Otanche":["M15507"],"Pachavita":["M15511"],"Páez":["M15514"],"Paipa":["M15516"],"Pajarito":["M15518"],"Panqueba":["M15522"],"Pauna":["M15531"],"Paya":["M15533"],"Paz de Río":["M15537"],"Pesca":["M15542"],"Pisba":["M15550"],"Puerto Boyacá":["M15572"],"Quípama":["M15580"],"Ramiriquí":["M15599"],"Ráquira":["M15600"],"Rondón":["M15621"],"Saboyá":["M15632"],"Sáchica":["M15638"],"Samacá":["M15646"],"San Eduardo":["M15660"],"San José de Pare":["M15664"],"San Luis de Gaceno":["M15667"],"San Mateo":["M15673"],"San Miguel de Sema":["M15676"],"San Pablo de Borbur":["M15681"],"Santa María":["M15690"],"Santa Rosa de Viterbo":["M15693"],"Santa Sofía":["M15696"],"Santana":["M15686"],"Sativanorte":["M15720"],"Sativasur":["M15723"],"Siachoque":["M15740"],"Soatá":["M15753"],"Socha":["M15757"],"Socotá":["M15755"],"Sogamoso":["M15759"],"Somondoco":["M15761"],"Sora":["M15762"],"Soracá":["M15764"],"Sotaquirá":["M15763"],"Susacón":["M15774"],"Sutamarchán":["M15776"],"Sutatenza":["M15778"],"Tasco":["M15790"],"Tenza":["M15798"],"Tibaná":["M15804"],"Tibasosa":["M15806"],"Tinjacá":["M15808"],"Tipacoque":["M15810"],"Toca":["M15814"],"Togüí":["M15816"],"Tópaga":["M15820"],"Tota":["M15822"],"Tunja":["M15001"],"Tununguá":["M15832"],"Turmequé":["M15835"],"Tuta":["M15837"],"Tutazá":["M15839"],"Úmbita":["M15842"],"Ventaquemada":["M15861"],"Villa de Leyva":["M15407"],"Viracachá":["M15879"],"Zetaquira":["M15897"]},
		"Caldas": {"Aguadas":["M17013"],"Anserma":["M17042"],"Aranzazu":["M17050"],"Belalcázar":["M17088"],"Chinchiná":["M17174"],"Filadelfia":["M17272"],"La Dorada":["M17380"],"La Merced":["M17388"],"Manizales":["M17001"],"Manzanares":["M17433"],"Marmato":["M17442"],"Marquetalia":["M17444"],"Marulanda":["M17446"],"Neira":["M17486"],"Norcasia":["M17495"],"Pácora":["M17513"],"Palestina":["M17524"],"Pensilvania":["M17541"],"Riosucio":["M17614"],"Risaralda":["M17616"],"Salamina":["M17653"],"Samaná":["M17662"],"San José":["M17665"],"Supía":["M17777"],"Victoria":["M17867"],"Villamaría":["M17873"],"Viterbo":["M17877"]},
		"Caquetá": {"Albania":["M18029"],"Belén de Los Andaquíes":["M18094"],"Cartagena del Chairá":["M18150"],"Curillo":["M18205"],"El Doncello":["M18247"],"El Paujíl":["M18256"],"Florencia":["M18001"],"La Montañita":["M18410"],"Milán":["M18460"],"Morelia":["M18479"],"Puerto Rico":["M18592"],"San José del Fragua":["M18610"],"San Vicente del Caguán":["M18753"],"Solano":["M18756"],"Solita":["M18785"],"Valparaíso":["M18860"]},
		"Casanare": {"Aguazul":["M85010"],"Chámeza":["M85015"],"Hato Corozal":["M85125"],"La Salina":["M85136"],"Maní":["M85139"],"Monterrey":["M85162"],"Nunchía":["M85225"],"Orocué":["M85230"],"Paz de Ariporo":["M85250"],"Pore":["M85263"],"Recetor":["M85279"],"Sabanalarga":["M85300"],"Sácama":["M85315"],"San Luis de Palenque":["M85325"],"Támara":["M85400"],"Tauramena":["M85410"],"Trinidad":["M85430"],"Villanueva":["M85440"],"Yopal":["M85001"]},
		"Cauca": {"Almaguer":["M19022"],"Argelia":["M19050"],"Balboa":["M19075"],"Bolívar":["M19100"],"Buenos Aires":["M19110"],"Cajibío":["M19130"],"Caldono":["M19137"],"Caloto":["M19142"],"Corinto":["M19212"],"El Tambo":["M19256"],"Florencia":["M19290"],"Guachené":["M19300"],"Guapi":["M19318"],"Inzá":["M19355"],"Jambaló":["M19364"],"La Sierra":["M19392"],"La Vega":["M19397"],"López de Micay":["M19418"],"Mercaderes":["M19450"],"Miranda":["M19455"],"Morales":["M19473"],"Padilla":["M19513"],"Páez":["M19517"],"Patía":["M19532"],"Piamonte":["M19533"],"Piendamó - Tunía":["M19548"],"Popayán":["M19001"],"Puerto Tejada":["M19573"],"Puracé":["M19585"],"Rosas":["M19622"],"San Sebastián":["M19693"],"Santa Rosa":["M19701"],"Santander de Quilichao":["M19698"],"Silvia":["M19743"],"Sotará Paispamba":["M19760"],"Suárez":["M19780"],"Sucre":["M19785"],"Timbío":["M19807"],"Timbiquí":["M19809"],"Toribío":["M19821"],"Totoró":["M19824"],"Villa Rica":["M19845"]},
		"Cesar": {	"Aguachica":["M20011"],"Agustín Codazzi":["M20013"],"Astrea":["M20032"],"Becerril":["M20045"],"Bosconia":["M20060"],"Chimichagua":["M20175"],"Chiriguaná":["M20178"],"Curumaní":["M20228"],"El Copey":["M20238"],"El Paso":["M20250"],"Gamarra":["M20295"],"González":["M20310"],"La Gloria":["M20383"],"La Jagua de Ibirico":["M20400"],"La Paz":["M20621"],"Manaure Balcón del Cesar":["M20443"],"Pailitas":["M20517"],"Pelaya":["M20550"],"Pueblo Bello":["M20570"],"Río de Oro":["M20614"],"San Alberto":["M20710"],"San Diego":["M20750"],"San Martín":["M20770"],"Tamalameque":["M20787"],"Valledupar":["M20001"]},
		"Chocó": {"Acandí":["M27006"],"Alto Baudó":["M27025"],"Atrato":["M27050"],"Bagadó":["M27073"],"Bahía Solano":["M27075"],"Bajo Baudó":["M27077"],"Bojayá":["M27099"],"Carmen del Darién":["M27150"],"Cértegui":["M27160"],"Condoto":["M27205"],"El Cantón del San Pablo":["M27135"],"El Carmen de Atrato":["M27245"],"El Litoral del San Juan":["M27250"],"Istmina":["M27361"],"Juradó":["M27372"],"Lloró":["M27413"],"Medio Atrato":["M27425"],"Medio Baudó":["M27430"],"Medio San Juan":["M27450"],"Nóvita":["M27491"],"Nuquí":["M27495"],"Quibdó":["M27001"],"Río Iró":["M27580"],"Río Quito":["M27600"],"Riosucio":["M27615"],"San José del Palmar":["M27660"],"Sipí":["M27745"],"Tadó":["M27787"],"Unguía":["M27800"],"Unión Panamericana":["M27810"]},
		"Córdoba": {"Ayapel":["M23068"],"Buenavista":["M23079"],"Canalete":["M23090"],"Cereté":["M23162"],"Chimá":["M23168"],"Chinú":["M23182"],"Ciénaga de Oro":["M23189"],"Cotorra":["M23300"],"La Apartada":["M23350"],"Lorica":["M23417"],"Los Córdobas":["M23419"],"Momil":["M23464"],"Montelíbano":["M23466"],"Montería":["M23001"],"Moñitos":["M23500"],"Planeta Rica":["M23555"],"Pueblo Nuevo":["M23570"],"Puerto Escondido":["M23574"],"Puerto Libertador":["M23580"],"Purísima de La Concepción":["M23586"],"Sahagún":["M23660"],"San Andrés Sotavento":["M23670"],"San Antero":["M23672"],"San Bernardo del Viento":["M23675"],"San Carlos":["M23678"],"San José de Uré":["M23682"],"San Pelayo":["M23686"],"Tierralta":["M23807"],"Tuchín":["M23815"],"Valencia":["M23855"]},
		"Cundinamarca": {"Agua de Dios":["M25001"],"Albán":["M25019"],"Anapoima":["M25035"],"Anolaima":["M25040"],"Apulo":["M25599"],"Arbeláez":["M25053"],"Beltrán":["M25086"],"Bituima":["M25095"],"Bojacá":["M25099"],"Cabrera":["M25120"],"Cachipay":["M25123"],"Cajicá":["M25126"],"Caparrapí":["M25148"],"Cáqueza":["M25151"],"Carmen de Carupa":["M25154"],"Chaguaní":["M25168"],"Chía":["M25175"],"Chipaque":["M25178"],"Choachí":["M25181"],"Chocontá":["M25183"],"Cogua":["M25200"],"Cota":["M25214"],"Cucunubá":["M25224"],"El Colegio":["M25245"],"El Peñón":["M25258"],"El Rosal":["M25260"],"Facatativá":["M25269"],"Fómeque":["M25279"],"Fosca":["M25281"],"Funza":["M25286"],"Fúquene":["M25288"],"Fusagasugá":["M25290"],"Gachalá":["M25293"],"Gachancipá":["M25295"],"Gachetá":["M25297"],"Gama":["M25299"],"Girardot":["M25307"],"Granada":["M25312"],"Guachetá":["M25317"],"Guaduas":["M25320"],"Guasca":["M25322"],"Guataquí":["M25324"],"Guatavita":["M25326"],"Guayabal de Síquima":["M25328"],"Guayabetal":["M25335"],"Gutiérrez":["M25339"],"Jerusalén":["M25368"],"Junín":["M25372"],"La Calera":["M25377"],"La Mesa":["M25386"],"La Palma":["M25394"],"La Peña":["M25398"],"La Vega":["M25402"],"Lenguazaque":["M25407"],"Machetá":["M25426"],"Madrid":["M25430"],"Manta":["M25436"],"Medina":["M25438"],"Mosquera":["M25473"],"Nariño":["M25483"],"Nemocón":["M25486"],"Nilo":["M25488"],"Nimaima":["M25489"],"Nocaima":["M25491"],"Pacho":["M25513"],"Paime":["M25518"],"Pandi":["M25524"],"Paratebueno":["M25530"],"Pasca":["M25535"],"Puerto Salgar":["M25572"],"Pulí":["M25580"],"Quebradanegra":["M25592"],"Quetame":["M25594"],"Quipile":["M25596"],"Ricaurte":["M25612"],"San Antonio del Tequendama":["M25645"],"San Bernardo":["M25649"],"San Cayetano":["M25653"],"San Francisco":["M25658"],"San Juan de Rioseco":["M25662"],"Sasaima":["M25718"],"Sesquilé":["M25736"],"Sibaté":["M25740"],"Silvania":["M25743"],"Simijaca":["M25745"],"Soacha":["M25754"],"Sopó":["M25758"],"Subachoque":["M25769"],"Suesca":["M25772"],"Supatá":["M25777"],"Susa":["M25779"],"Sutatausa":["M25781"],"Tabio":["M25785"],"Tausa":["M25793"],"Tena":["M25797"],"Tenjo":["M25799"],"Tibacuy":["M25805"],"Tibirita":["M25807"],"Tocaima":["M25815"],"Tocancipá":["M25817"],"Topaipí":["M25823"],"Ubalá":["M25839"],"Ubaque":["M25841"],"Une":["M25845"],"Útica":["M25851"],"Venecia":["M25506"],"Vergara":["M25862"],"Vianí":["M25867"],"Villa de San Diego de Ubaté":["M25843"],"Villagómez":["M25871"],"Villapinzón":["M25873"],"Villeta":["M25875"],"Viotá":["M25878"],"Yacopí":["M25885"],"Zipacón":["M25898"],"Zipaquirá":["M25899"]},
		"Guainía": {"Barrancominas (CD)":["M94343"],"Cacahual (CD)":["M94886"],"Inírida":["M94001"],"La Guadalupe (CD)":["M94885"],"Mapiripana (CD)":["M94663"],"Morichal (CD)":["M94888"],"Pana Pana (CD)":["M94887"],"Puerto Colombia (CD)":["M94884"],"San Felipe (CD)":["M94883"]},
		"Guaviare": {"Calamar":["M95015"],"El Retorno":["M95025"],"Miraflores":["M95200"],"San José del Guaviare":["M95001"]},
		"Huila": {"Acevedo":["M41006"],"Agrado":["M41013"],"Aipe":["M41016"],"Algeciras":["M41020"],"Altamira":["M41026"],"Baraya":["M41078"],"Campoalegre":["M41132"],"Colombia":["M41206"],"Elías":["M41244"],"Garzón":["M41298"],"Gigante":["M41306"],"Guadalupe":["M41319"],"Hobo":["M41349"],"Íquira":["M41357"],"Isnos":["M41359"],"La Argentina":["M41378"],"La Plata":["M41396"],"Nátaga":["M41483"],"Neiva":["M41001"],"Oporapa":["M41503"],"Paicol":["M41518"],"Palermo":["M41524"],"Palestina":["M41530"],"Pital":["M41548"],"Pitalito":["M41551"],"Rivera":["M41615"],"Saladoblanco":["M41660"],"San Agustín":["M41668"],"Santa María":["M41676"],"Suaza":["M41770"],"Tarqui":["M41791"],"Tello":["M41799"],"Teruel":["M41801"],"Tesalia":["M41797"],"Timaná":["M41807"],"Villavieja":["M41872"],"Yaguará":["M41885"]},
		"La Guajira": {"Albania":["M44035"],"Barrancas":["M44078"],"Dibulla":["M44090"],"Distracción":["M44098"],"El Molino":["M44110"],"Fonseca":["M44279"],"Hatonuevo":["M44378"],"La Jagua del Pilar":["M44420"],"Maicao":["M44430"],"Manaure":["M44560"],"Riohacha":["M44001"],"San Juan del Cesar":["M44650"],"Uribia":["M44847"],"Urumita":["M44855"],"Villanueva":["M44874"]},
		"Magdalena": {"Algarrobo":["M47030"],"Aracataca":["M47053"],"Ariguaní":["M47058"],"Cerro de San Antonio":["M47161"],"Chibolo":["M47170"],"Ciénaga":["M47189"],"Concordia":["M47205"],"El Banco":["M47245"],"El Piñón":["M47258"],"El Retén":["M47268"],"Fundación":["M47288"],"Guamal":["M47318"],"Nueva Granada":["M47460"],"Pedraza":["M47541"],"Pijiño del Carmen":["M47545"],"Pivijay":["M47551"],"Plato":["M47555"],"Puebloviejo":["M47570"],"Remolino":["M47605"],"Sabanas de San Ángel":["M47660"],"Salamina":["M47675"],"San Sebastián de Buenavista":["M47692"],"San Zenón":["M47703"],"Santa Ana":["M47707"],"Santa Bárbara de Pinto":["M47720"],"Santa Marta":["M47001"],"Sitionuevo":["M47745"],"Tenerife":["M47798"],"Zapayán":["M47960"],"Zona Bananera":["M47980"]},
		"Meta": {"Acacías":["M50006"],"Barranca de Upía":["M50110"],"Cabuyaro":["M50124"],"Castilla la Nueva":["M50150"],"Cubarral":["M50223"],"Cumaral":["M50226"],"El Calvario":["M50245"],"El Castillo":["M50251"],"El Dorado":["M50270"],"Fuente de Oro":["M50287"],"Granada":["M50313"],"Guamal":["M50318"],"La Macarena":["M50350"],"Lejanías":["M50400"],"Mapiripán":["M50325"],"Mesetas":["M50330"],"Puerto Concordia":["M50450"],"Puerto Gaitán":["M50568"],"Puerto Lleras":["M50577"],"Puerto López":["M50573"],"Puerto Rico":["M50590"],"Restrepo":["M50606"],"San Carlos de Guaroa":["M50680"],"San Juan de Arama":["M50683"],"San Juanito":["M50686"],"San Martín":["M50689"],"Uribe":["M50370"],"Villavicencio":["M50001"],"Vistahermosa":["M50711"]},
		"Nariño": {"Albán":["M52019"],"Aldana":["M52022"],"Ancuya":["M52036"],"Arboleda":["M52051"],"Barbacoas":["M52079"],"Belén":["M52083"],"Buesaco":["M52110"],"Chachagüí":["M52240"],"Colón":["M52203"],"Consacá":["M52207"],"Contadero":["M52210"],"Córdoba":["M52215"],"Cuaspud Carlosama":["M52224"],"Cumbal":["M52227"],"Cumbitara":["M52233"],"El Charco":["M52250"],"El Peñol":["M52254"],"El Rosario":["M52256"],"El Tablón de Gómez":["M52258"],"El Tambo":["M52260"],"Francisco Pizarro":["M52520"],"Funes":["M52287"],"Guachucal":["M52317"],"Guaitarilla":["M52320"],"Gualmatán":["M52323"],"Iles":["M52352"],"Imués":["M52354"],"Ipiales":["M52356"],"La Cruz":["M52378"],"La Florida":["M52381"],"La Llanada":["M52385"],"La Tola":["M52390"],"La Unión":["M52399"],"Leiva":["M52405"],"Linares":["M52411"],"Los Andes":["M52418"],"Magüí":["M52427"],"Mallama":["M52435"],"Mosquera":["M52473"],"Nariño":["M52480"],"Olaya Herrera":["M52490"],"Ospina":["M52506"],"Pasto":["M52001"],"Policarpa":["M52540"],"Potosí":["M52560"],"Providencia":["M52565"],"Puerres":["M52573"],"Pupiales":["M52585"],"Ricaurte":["M52612"],"Roberto Payán":["M52621"],"Samaniego":["M52678"],"San Andrés de Tumaco":["M52835"],"San Bernardo":["M52685"],"San Lorenzo":["M52687"],"San Pablo":["M52693"],"San Pedro de Cartago":["M52694"],"Sandoná":["M52683"],"Santa Bárbara":["M52696"],"Santacruz":["M52699"],"Sapuyes":["M52720"],"Taminango":["M52786"],"Tangua":["M52788"],"Túquerres":["M52838"],"Yacuanquer":["M52885"]},
		"Norte de Santander": {"Ábrego":["M54003"],"Arboledas":["M54051"],"Bochalema":["M54099"],"Bucarasica":["M54109"],"Cáchira":["M54128"],"Cácota":["M54125"],"Chinácota":["M54172"],"Chitagá":["M54174"],"Convención":["M54206"],"Cucutilla":["M54223"],"Durania":["M54239"],"El Carmen":["M54245"],"El Tarra":["M54250"],"El Zulia":["M54261"],"Gramalote":["M54313"],"Hacarí":["M54344"],"Herrán":["M54347"],"La Esperanza":["M54385"],"La Playa":["M54398"],"Labateca":["M54377"],"Los Patios":["M54405"],"Lourdes":["M54418"],"Mutiscua":["M54480"],"Ocaña":["M54498"],"Pamplona":["M54518"],"Pamplonita":["M54520"],"Puerto Santander":["M54553"],"Ragonvalia":["M54599"],"Salazar":["M54660"],"San Calixto":["M54670"],"San Cayetano":["M54673"],"San José de Cúcuta":["M54001"],"Santiago":["M54680"],"Sardinata":["M54720"],"Silos":["M54743"],"Teorama":["M54800"],"Tibú":["M54810"],"Toledo":["M54820"],"Villa Caro":["M54871"],"Villa del Rosario":["M54874"]},
		"Putumayo": {"Colón":["M86219"],"Mocoa":["M86001"],"Orito":["M86320"],"Puerto Asís":["M86568"],"Puerto Caicedo":["M86569"],"Puerto Guzmán":["M86571"],"Puerto Leguízamo":["M86573"],"San Francisco":["M86755"],"San Miguel":["M86757"],"Santiago":["M86760"],"Sibundoy":["M86749"],"Valle del Guamuez":["M86865"],"Villagarzón":["M86885"]},
		"Quindio": {"Armenia":["M63001"],"Buenavista":["M63111"],"Calarcá":["M63130"],"Circasia":["M63190"],"Córdoba":["M63212"],"Filandia":["M63272"],"Génova":["M63302"],"La Tebaida":["M63401"],"Montenegro":["M63470"],"Pijao":["M63548"],"Quimbaya":["M63594"],"Salento":["M63690"]},
		"Risaralda": {"Apía":["M66045"],"Balboa":["M66075"],"Belén de Umbría":["M66088"],"Dosquebradas":["M66170"],"Guática":["M66318"],"La Celia":["M66383"],"La Virginia":["M66400"],"Marsella":["M66440"],"Mistrató":["M66456"],"Pereira":["M66001"],"Pueblo Rico":["M66572"],"Quinchía":["M66594"],"Santa Rosa de Cabal":["M66682"],"Santuario":["M66687"]},
		"Santander": {"Aguada":["M68013"],"Albania":["M68020"],"Aratoca":["M68051"],"Barbosa":["M68077"],"Barichara":["M68079"],"Barrancabermeja":["M68081"],"Betulia":["M68092"],"Bolívar":["M68101"],"Bucaramanga":["M68001"],"Cabrera":["M68121"],"California":["M68132"],"Capitanejo":["M68147"],"Carcasí":["M68152"],"Cepitá":["M68160"],"Cerrito":["M68162"],"Charalá":["M68167"],"Charta":["M68169"],"Chimá":["M68176"],"Chipatá":["M68179"],"Cimitarra":["M68190"],"Concepción":["M68207"],"Confines":["M68209"],"Contratación":["M68211"],"Coromoro":["M68217"],"Curití":["M68229"],"El Carmen de Chucurí":["M68235"],"El Guacamayo":["M68245"],"El Peñón":["M68250"],"El Playón":["M68255"],"Encino":["M68264"],"Enciso":["M68266"],"Florián":["M68271"],"Floridablanca":["M68276"],"Galán":["M68296"],"Gámbita":["M68298"],"Girón":["M68307"],"Guaca":["M68318"],"Guadalupe":["M68320"],"Guapotá":["M68322"],"Guavatá":["M68324"],"Güepsa":["M68327"],"Hato":["M68344"],"Jesús María":["M68368"],"Jordán":["M68370"],"La Belleza":["M68377"],"La Paz":["M68397"],"Landázuri":["M68385"],"Lebrija":["M68406"],"Los Santos":["M68418"],"Macaravita":["M68425"],"Málaga":["M68432"],"Matanza":["M68444"],"Mogotes":["M68464"],"Molagavita":["M68468"],"Ocamonte":["M68498"],"Oiba":["M68500"],"Onzaga":["M68502"],"Palmar":["M68522"],"Palmas del Socorro":["M68524"],"Páramo":["M68533"],"Piedecuesta":["M68547"],"Pinchote":["M68549"],"Puente Nacional":["M68572"],"Puerto Parra":["M68573"],"Puerto Wilches":["M68575"],"Rionegro":["M68615"],"Sabana de Torres":["M68655"],"San Andrés":["M68669"],"San Benito":["M68673"],"San Gil":["M68679"],"San Joaquín":["M68682"],"San José de Miranda":["M68684"],"San Miguel":["M68686"],"San Vicente de Chucurí":["M68689"],"Santa Bárbara":["M68705"],"Santa Helena del Opón":["M68720"],"Simacota":["M68745"],"Socorro":["M68755"],"Suaita":["M68770"],"Sucre":["M68773"],"Suratá":["M68780"],"Tona":["M68820"],"Valle de San José":["M68855"],"Vélez":["M68861"],"Vetas":["M68867"],"Villanueva":["M68872"],"Zapatoca":["M68895"]},
		"Sucre": {"Buenavista":["M70110"],"Caimito":["M70124"],"Chalán":["M70230"],"Coloso":["M70204"],"Corozal":["M70215"],"Coveñas":["M70221"],"El Roble":["M70233"],"Galeras":["M70235"],"Guaranda":["M70265"],"La Unión":["M70400"],"Los Palmitos":["M70418"],"Majagual":["M70429"],"Morroa":["M70473"],"Ovejas":["M70508"],"Palmito":["M70523"],"Sampués":["M70670"],"San Benito Abad":["M70678"],"San Juan de Betulia":["M70702"],"San Luis de Sincé":["M70742"],"San Marcos":["M70708"],"San Onofre":["M70713"],"San Pedro":["M70717"],"Santiago de Tolú":["M70820"],"Sincelejo":["M70001"],"Sucre":["M70771"],"Tolú Viejo":["M70823"]},
		"Tolima": { "Ibagué":["M73001"], "Alpujarra":["M73024"],"Alvarado":["M73026"],"Ambalema":["M73030"],"Anzoátegui":["M73043"], "Armero":["M73055"],"Ataco":["M73067"],"Cajamarca":["M73124"],"Carmen de Apicalá":["M73148"],"Casabianca":["M73152"],"Chaparral":["M73168"],"Coello":["M73200"],"Coyaima":["M73217"],"Cunday":["M73226"],"Dolores":["M73236"],"Espinal":["M73268"],"Falan": ["M73270"],"Flandes":["M73275"],"Fresno": ["M73283"],"Guamo": ["M73319"],"Herveo": ["M73347"],"Honda":["M73349"],"Icononzo":["M73352"],"Lérida":["M73408"],"Líbano":["M73411"],"Mariquita": ["M73443"],"Melgar": ["M73449"],"Murillo":["M73461"],"Natagaima":["M73483"],"Ortega":["M73504"],"Palocabildo":["M73520"],"Piedras":["M73547"],"Planadas": ["M73555"],"Prado":["M73563"],"Purificación":["M73585"],"Rioblanco":["M73616"],"Roncesvalles":["M73622"],"Rovira": ["M73624"],"Saldaña":["M73671"],"San Antonio":["M73675"],"San Luis":["M73678"],"Santa Isabel":["M73686"],"Suárez":["M73770"],"Valle de San Juan":["M73854"],"Venadillo":["M73861"],"Villahermosa":["M73870"],"Villarrica":["M73873"]},
		"Valle del Cauca": {"Alcalá":["M76020"],"Andalucía":["M76036"],"Ansermanuevo":["M76041"],"Argelia":["M76054"],"Bolívar":["M76100"],"Buenaventura":["M76109"],"Bugalagrande":["M76113"],"Caicedonia":["M76122"],"Cali":["M76001"],"Calima":["M76126"],"Candelaria":["M76130"],"Cartago":["M76147"],"Dagua":["M76233"],"El Águila":["M76243"],"El Cairo":["M76246"],"El Cerrito":["M76248"],"El Dovio":["M76250"],"Florida":["M76275"],"Ginebra":["M76306"],"Guacarí":["M76318"],"Guadalajara de Buga":["M76111"],"Jamundí":["M76364"],"La Cumbre":["M76377"],"La Unión":["M76400"],"La Victoria":["M76403"],"Obando":["M76497"],"Palmira":["M76520"],"Pradera":["M76563"],"Restrepo":["M76606"],"Riofrío":["M76616"],"Roldanillo":["M76622"],"San Pedro":["M76670"],"Sevilla":["M76736"],"Toro":["M76823"],"Trujillo":["M76828"],"Tuluá":["M76834"],"Ulloa":["M76845"],"Versalles":["M76863"],"Vijes":["M76869"],"Yotoco":["M76890"],"Yumbo":["M76892"],"Zarzal":["M76895"]},
		"Vaupés": {"Carurú":["M97161"],"Mitú":["M97001"],"Pacoa (CD)":["M97511"],"Papunahua (CD)":["M97777"],"Taraira":["M97666"],"Yavaraté (CD)":["M97889"]},
		"Vichada": {"Cumaribo":["M99773"],"La Primavera":["M99524"],"Puerto Carreño":["M99001"],"Santa Rosalía":["M99624"]}
	};
	return DepMun;
}
function depreg(){ 
	var departamentoReg = {
		"Amazonas": {		"code1":"D91",
						"code2":"91",		
						"codeReg":"105",
						"codeReg2":"206",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Antioquia": {	"code1":"D05",
						"code2":"5",		
						"codeReg":"103",
						"codeReg2":"203",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Arauca":	 {	"code1":"D81",
						"code2":"81",		
						"codeReg":"105",
						"codeReg2":"204",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Atlántico": {	"code1":"D08",
						"code2":"8",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Bogotá, D.C.": 	{	"code1":"D11",
						"code2":"11",		
						"codeReg":"106",
						"codeReg2":"202",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Bolívar": 	{	"code1":"D13",
						"code2":"13",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Boyacá": 	{	"code1":"D15",
						"code2":"15",		
						"codeReg":"102",
						"codeReg2":"202",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Caldas": 	{	"code1":"D17",
						"code2":"17",		
						"codeReg":"103",
						"codeReg2":"203",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Caquetá": 	{	"code1":"D18",
						"code2":"18",		
						"codeReg":"103",
						"codeReg2":"206",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Casanare": {	"code1":"D85",
						"code2":"85",		
						"codeReg":"105",
						"codeReg2":"204",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Cauca": 	{	"code1":"D19",
						"code2":"19",		
						"codeReg":"104",
						"codeReg2":"205",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Cesar": 	{	"code1":"D20",
						"code2":"20",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Chocó": 	{	"code1":"D27",
						"code2":"27",		
						"codeReg":"104",
						"codeReg2":"205",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Córdoba": 	{	"code1":"D23",
						"code2":"23",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Cundinamarca": {	"code1":"D25",
						"code2":"25",		
						"codeReg":"102",
						"codeReg2":"202",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Guainía": {	"code1":"D94",
						"code2":"94",		
						"codeReg":"105",
						"codeReg2":"206",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Guaviare": {	"code1":"D95",
						"code2":"95",		
						"codeReg":"105",
						"codeReg2":"206",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Huila": 	{	"code1":"D41",
						"code2":"41",		
						"codeReg":"103",
						"codeReg2":"202",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"La Guajira": {	"code1":"D44",
						"code2":"44",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Magdalena": {	
						"code1":"D47", "code2":"47",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Meta": 	{	
						"code1":"D50", "code2":"50",		
						"codeReg":"102",
						"codeReg2":"204",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Nariño": 	{	
						"code1":"D52", "code2":"52",		
						"codeReg":"104",
						"codeReg2":"205",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Norte de Santander": { 
						"code1":"D54", "code2":"54",		
						"codeReg":"102",
						"codeReg2":"202",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},			
		"Putumayo": {   
						"code1":"D86", "code2":"86",		
						"codeReg":"105",
						"codeReg2":"206",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Quindio": {    
						"code1":"D63", "code2":"63",		
						"codeReg":"103",
						"codeReg2":"203",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Risaralda": { 
						"code1":"D66", "code2":"66",		
						"codeReg":"103",
						"codeReg2":"203",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Archipiélago de San Andrés": { 
						"code1":"D88", "code2":"88",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/',

					},
		"Santander": {  "code1":"D68", "code2":"68",		
						"codeReg":"102",
						"codeReg2":"202",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Sucre": 	{   "code1":"D70", "code2":"70",		
						"codeReg":"101",
						"codeReg2":"201",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/' 
					},
		"Tolima": 	{   "code1":"D73", "code2":"73",		
						"codeReg":"103",
						"codeReg2":"202",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Valle del Cauca": 	{   
						"code1":"D76", "code2":"76",	
						"codeReg":"104",
						"codeReg2":"205",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Vaupés": 	{   "code1":"D97", "code2":"97",		
						"codeReg":"105",
						"codeReg2":"206",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					},
		"Vichada": 	{   "code1":"D99", "code2":"99",		
						"codeReg":"105",
						"codeReg2":"204",
						"url":'https://datastudio.google.com/embed/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/', 
						"url2":'https://datastudio.google.com/reporting/2954b67a-acbf-4a88-bdca-f2f393324484/'
					}
	
	}
	return departamentoReg;
	
	
}
