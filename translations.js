const laymanDictionary = {
    "color-contrast": {
        en: "The text doesn't stand out enough from the background, making it hard to read.",
        tl: "Hindi masyadong halata ang text sa background, kaya mahirap itong basahin."
    },
    "image-alt": {
        en: "This image is missing a text description, which is needed for visually impaired users.",
        tl: "Walang text na naglalarawan sa larawang ito, na kailangan ng mga bulag na gumagamit."
    },
    "button-name": {
        en: "This button doesn't have a clear name, so screen readers won't know what it does.",
        tl: "Walang malinaw na pangalan ang button na ito, kaya hindi malalaman ng screen readers kung ano ang silbi nito."
    }
    // Add other axe-core violation IDs here later
};

// State variable for current language
let currentLang = 'en'; // default

// Function to get the translation
function getLaymanText(ruleId) {
    if (laymanDictionary[ruleId]) {
        return laymanDictionary[ruleId][currentLang];
    }
    // Fallback if rule isn't in dictionary yet
    return currentLang === 'en' ? "An accessibility issue was found here." : "May nakitang isyu sa accessibility rito.";
}