const wordToNum = {
    'un': 1, 'uno': 1, 'una': 1, 'unos': 1, 'unas': 1,
    'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
    'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
    'quince': 15, 'veinte': 20
};

const transcript = "una bandeja promesas";
const lowerTranscript = transcript.toLowerCase();

const numberPattern = Object.keys(wordToNum).join('|');
const regex = new RegExp(`(\\d+|${numberPattern})\\s+(.+?)(?=\\s+(\\d+|${numberPattern})|$)`, 'gi');

let match;
while ((match = regex.exec(lowerTranscript)) !== null) {
    console.log("Match found!");
    console.log("Qty Raw:", match[1]);
    console.log("Name Raw:", match[2]);
}
