'use strict';

const AREAS = [
  'Cirugía General',
  'Traumatología',
  'Pediatría',
  'Medicina Interna',
  'Ginecología',
  'Cardiología',
  'Oftalmología',
  'Neurología',
  'Dermatología',
  'Otorrinolaringología',
];

const HORAS = [
  '07:20',
  '07:40',
  '08:00',
  '08:20',
  '08:40',
  '09:00',
  '09:20',
  '09:40',
  '10:00',
  '10:20',
  '10:40',
  '11:00',
  '11:20',
  '11:40',
  '12:00',
  '13:00',
  '13:20',
  '13:40',
  '14:00',
  '14:20',
  '14:40',
  '15:00',
  '15:20',
  '15:40',
];

const NOMBRES = [
  'MARTA MENDOZA ALVAREZ',
  'JUAN CARLOS RAMIREZ SOTO',
  'ANA LUCIA MORALES CASTILLO',
  'PEDRO ANTONIO HERNANDEZ LOPEZ',
  'MARIA JOSE GARCIA ESTRADA',
  'LUIS FERNANDO PEREZ IXCOY',
  'CARMEN ROSA LOPEZ BAUTISTA',
  'JOSE MIGUEL VASQUEZ RODAS',
  'GLORIA PATRICIA SANCHEZ MARTINEZ',
  'OSCAR RENE GOMEZ CHAN',
  'SILVIA MARLEN DE LEON OROZCO',
  'EDGAR GEOVANY CASTRO REYES',
  'ROSA ELENA ALVARADO MOLINA',
  'MANUEL DE JESUS FIGUEROA AGUILAR',
  'BLANCA ESTELA QUEVEDO PALACIOS',
  'WALTER ALEXANDER CONTRERAS MEJIA',
  'KAREN VANESSA SANTIZO CABRERA',
  'JORGE ARMANDO IXCHOP CHOC',
  'LILIAN YESENIA TUM CANO',
  'HECTOR DAVID ROSALES BATEN',
  'MIRNA LISSETTE CACERES PINEDA',
  'RUBEN DARIO POOU XIU',
  'SANDRA PATRICIA CALDERON LOPEZ',
  'MARVIN ESTUARDO CORDERO SALAZAR',
  'SUSANA ELIZABETH CHUB CAAL',
  'ALLAN JOSUE MARTINEZ CONTRERAS',
  'INGRID CAROLINA POP TUT',
  'BYRON ALEJANDRO LINARES GARCIA',
  'HEIDI MARIELA TOC VELASQUEZ',
  'DIEGO ESTUARDO RIVERA MONTERROSO',
  'NORMA JEANNETTE LOPEZ SICAN',
  'FREDY ORLANDO MENCOS ARDON',
  'VIOLETA DEL ROSARIO IXQUIAC TUM',
  'JULIO CESAR BARRIOS GAMARRO',
  'CINDY ABIGAIL MATEO PEREZ',
  'RONALD EDUARDO SEMPAL GARCIA',
  'DAFNE SOFIA ARRIOLA CHAVARRIA',
  'WILSON ROBERTO CAAL XOL',
  'TELMA YESENIA GONZALEZ ROLDAN',
  'MARIO RENE CIFUENTES BARILLAS',
];

function construirExpedientes(cantidad) {
  const expedientes = [];
  for (let i = 0; i < cantidad; i += 1) {
    const numero = 101011 + i;
    const nombre = NOMBRES[i % NOMBRES.length];
    const area = AREAS[i % AREAS.length];
    const hora = HORAS[i % HORAS.length];
    expedientes.push({
      numeroExpediente: String(numero),
      pacienteNombre: nombre,
      subespecialidadNombre: area,
      horaEstimada: hora,
      estadoActual: 'en_transito_entrega',
    });
  }
  return expedientes;
}

module.exports = {
  AREAS,
  HORAS,
  NOMBRES,
  construirExpedientes,
};
