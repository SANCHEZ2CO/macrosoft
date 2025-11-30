import stringSimilarity from 'string-similarity';

const menuData = [
    { name: "BANDEJA PROMESAS MAMÁ" },
    { name: "BANDEJA PROMESAS PAPÁ" },
    { name: "FIT BRUNCH" }
];

const productNames = menuData.map(p => p.name.toLowerCase());
const transcriptName = "bandeja promesas";

const matches = stringSimilarity.findBestMatch(transcriptName, productNames);

console.log("Best match:", matches.bestMatch);
console.log("All ratings:", matches.ratings);
