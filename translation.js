const laymanDictionary = {
    // === IMAGES, MEDIA & DOCUMENTS ===
    "area-alt": "A clickable area on an image map is missing a description, so screen readers won't know what it links to.",
    "image-alt": "An image is missing a hidden text description. Visually impaired users won't know what this image represents.",
    "image-redundant-alt": "An image's hidden description just repeats text that is already visible on the screen, creating annoying double-reading for screen readers.",
    "input-image-alt": "An image used as a form button is missing a text description.",
    "object-alt": "An embedded object (like a widget or flash element) is missing a text description.",
    "role-img-alt": "An element acting as an image is missing its text alternative.",
    "svg-img-alt": "An SVG graphic is missing accessible text, leaving visually impaired users with no context.",
    "server-side-image-map": "The page uses an outdated server-side image map that is completely invisible to screen readers.",
    "video-caption": "A video clip is missing captions, making it inaccessible to deaf or hard-of-hearing users.",
    "audio-caption": "An audio clip is missing a text transcript or captions.",
    "no-autoplay-audio": "Audio or video plays automatically without a way to stop it, which heavily interferes with a blind user's screen reader audio.",
    "document-title": "The webpage is missing a title in the browser tab, making it hard for screen readers to identify what page they are on.",

    // === FORMS, INPUTS & BUTTONS ===
    "button-name": "A button is missing a text label. Screen readers won't be able to tell the user what clicking this button actually does.",
    "input-button-name": "An input button is missing a descriptive name.",
    "label": "A form input field is missing a proper text label, so users don't know what information to type here.",
    "label-title-only": "A form input is using only hidden attributes to label itself, which isn't sufficient for all assistive technologies.",
    "form-field-multiple-labels": "A form input has multiple conflicting labels, which will confuse screen readers trying to explain it.",
    "select-name": "A dropdown menu doesn't have a label telling the user what they are supposed to select.",
    "autocomplete-valid": "A form input has an invalid 'autocomplete' tag, preventing users from auto-filling their information (like name or address).",

    // === DESIGN, STYLING & LANGUAGE ===
    "color-contrast": "The text color doesn't stand out enough against its background, making it hard to read for users with visual impairments.",
    "color-contrast-enhanced": "The text color fails the strictest enhanced contrast rules against its background.",
    "avoid-inline-spacing": "Text spacing is rigidly locked in the code, preventing users with reading disorders (like dyslexia) from adjusting it to their needs.",
    "blink": "The page uses outdated, blinking text elements that can trigger seizures or highly distract users.",
    "marquee": "The page uses outdated, scrolling text elements that cannot be paused by users reading slowly.",
    "meta-refresh": "The webpage is set to auto-refresh without warning, which can heavily disorient users.",
    "meta-refresh-no-exceptions": "The webpage uses delayed automatic refreshing, which breaks strict accessibility guidelines.",
    "meta-viewport": "The webpage code intentionally blocks users from zooming in, heavily penalizing people with poor vision.",
    "meta-viewport-large": "The webpage prevents users from zooming in significantly, making it difficult for the visually impaired.",
    "css-orientation-lock": "The webpage forces itself to stay in landscape or portrait mode, making it hard to use on mounted devices or mobile accessibility setups.",
    "html-has-lang": "The webpage's language (e.g., English) isn't declared in the code, which breaks translation tools and screen reader pronunciations.",
    "html-lang-valid": "The primary language code specified in the webpage is invalid or misspelled.",
    "valid-lang": "A language code attached to a specific paragraph or element is invalid or misspelled.",
    "html-xml-lang-mismatch": "The webpage has conflicting language tags in its code, confusing translation tools.",

    // === STRUCTURE, LAYOUT & TABLES ===
    "region": "Some content is floating outside of the main page structural zones, which can confuse keyboard navigation tools.",
    "landmark-one-main": "The webpage is missing a 'Main' structural tag, making it difficult for users to skip directly to the primary content.",
    "landmark-no-duplicate-main": "The webpage has more than one 'Main' structural tag, which confuses screen readers.",
    "landmark-no-duplicate-banner": "The webpage has multiple 'Banner' (Header) zones defined, which is structurally confusing.",
    "landmark-no-duplicate-contentinfo": "The webpage has multiple 'Contentinfo' (Footer) zones defined.",
    "landmark-banner-is-top-level": "The header zone is incorrectly trapped inside another structural element.",
    "landmark-contentinfo-is-top-level": "The footer zone is incorrectly trapped inside another structural element.",
    "landmark-main-is-top-level": "The main content zone is incorrectly trapped inside another structural element.",
    "landmark-complementary-is-top-level": "A sidebar (complementary) zone is placed incorrectly within the site structure.",
    "landmark-unique": "Multiple structural landmarks are missing unique names to tell them apart.",
    "page-has-heading-one": "The page is missing a primary title (an H1 tag), which helps screen readers understand what the entire page is about.",
    "heading-order": "The headings on this page skip levels (e.g., jumping from an H2 directly to an H4). This breaks the logical outline for screen reader users.",
    "empty-heading": "A heading tag is completely empty, creating a confusing blank announcement for screen readers.",
    "p-as-heading": "A normal paragraph is styled to look like a heading, but isn't coded as one. Screen readers won't recognize it as a title.",
    "list": "A list is coded incorrectly. Screen readers rely on proper list codes to tell users how many items to expect.",
    "listitem": "A list item is floating on its own outside of a proper list container.",
    "definition-list": "A description list is formatted incorrectly in the code.",
    "dlitem": "A description list item is floating outside of its proper container, causing screen readers to read it out of order.",
    "scope-attr-valid": "A data table uses the 'scope' attribute incorrectly, confusing screen readers about which cells belong to which headers.",
    "td-headers-attr": "A data table uses the 'headers' attribute incorrectly.",
    "th-has-data-cells": "A table header has no actual data cells beneath it, creating an empty column or row.",
    "empty-table-header": "A table header is completely empty, so screen readers won't know what the column represents.",
    "table-duplicate-name": "A data table's title and its summary repeat the exact same text unnecessarily.",
    "table-fake-caption": "A table has a title visually, but isn't using the proper code to link the title to the table for screen readers.",
    "td-has-header": "A large data table contains data cells that aren't linked to any headers, making it impossible to navigate blindly.",
    "frame-title": "An embedded frame (like a YouTube video or widget) is missing a descriptive title.",
    "frame-title-unique": "An embedded frame shares the exact same title as another frame, making them hard to tell apart.",
    "frame-tested": "An iframe is missing the required testing script, so the scanner couldn't check its contents.",

    // === NAVIGATION, LINKS & KEYBOARDS ===
    "bypass": "The page is missing a 'Skip to Main Content' link, forcing keyboard users to manually tab through the entire menu on every single page.",
    "skip-link": "A 'Skip to Content' link exists, but it is broken and doesn't actually jump to the content.",
    "tabindex": "An element forces a custom keyboard tab order (tabindex greater than 0), which unpredictably jumps the user's cursor around the page.",
    "accesskeys": "A keyboard shortcut is assigned to multiple different elements, causing a severe navigation conflict.",
    "nested-interactive": "Interactive elements (like a button inside a link) are incorrectly placed inside each other, breaking keyboard navigation.",
    "scrollable-region-focusable": "A scrollable box on the page cannot be scrolled using a keyboard, trapping users who cannot use a mouse.",
    "frame-focusable-content": "An embedded frame contains interactive content but is hidden from keyboard navigation.",
    "link-in-text-block": "Links inside a paragraph are only identifiable by color. They must have an underline or bold styling for colorblind users.",
    "link-name": "A link is missing descriptive text (e.g., it might just be an empty icon), so screen readers don't know where it goes.",
    "identical-links-same-purpose": "Multiple links on the page have the same name but go to different places, which is highly confusing.",
    "target-size": "Buttons or links are too small or too close together, making them difficult to tap for users with motor impairments on touch devices.",
    "focus-order-semantics": "Elements in the keyboard tab order don't have the proper interactive roles assigned to them.",

    // === SCREEN READERS & ARIA (TECHNICAL ASSISTIVE TAGS) ===
    "aria-allowed-attr": "An advanced accessibility tag is being used on an element that doesn't support it, which confuses screen readers.",
    "aria-braille-equivalent": "A braille accessibility label is missing a standard text equivalent for non-braille users.",
    "aria-command-name": "An interactive element (like a button or link) is missing an accessible name.",
    "aria-conditional-attr": "An accessibility attribute is being used incorrectly according to its specific role.",
    "aria-deprecated-role": "The code uses an outdated accessibility role that modern screen readers may no longer support.",
    "aria-hidden-body": "The entire webpage body is accidentally hidden from screen readers, making the page completely blank for visually impaired users.",
    "aria-hidden-focus": "An element is hidden from screen readers but can still be accessed via keyboard. This creates a confusing invisible trap.",
    "aria-input-field-name": "A text input field is missing a name, so screen readers won't know what the user should type here.",
    "aria-meter-name": "A visual meter is missing a name, so screen readers can't explain what is being measured.",
    "aria-progressbar-name": "A progress bar is missing a name, so screen readers can't explain what is loading.",
    "aria-prohibited-attr": "An accessibility tag is being used where it is strictly not allowed, confusing assistive technologies.",
    "aria-required-attr": "A specialized accessibility element is missing required information to function properly for screen readers.",
    "aria-required-children": "An accessibility element is missing its required child elements, breaking its structure.",
    "aria-required-parent": "An accessibility element is missing its required parent container.",
    "aria-roles": "An accessibility tag contains a typo or invalid role, meaning screen readers cannot process it.",
    "aria-tab-name": "An interactive tab is missing a name.",
    "aria-toggle-field-name": "A toggle switch or field is missing a name.",
    "aria-tooltip-name": "A tooltip element is missing an accessible name.",
    "aria-valid-attr-value": "An accessibility tag has an invalid value that screen readers cannot process.",
    "aria-valid-attr": "An attribute starting with 'aria-' is misspelled or doesn't actually exist in the accessibility guidelines.",
    "duplicate-id-aria": "Multiple elements are sharing the exact same ID code for accessibility labels, causing screen readers to read the wrong information.",
    "aria-allowed-role": "An element is using an accessibility role that it is not permitted to use.",
    "aria-dialog-name": "A pop-up dialog box or alert is missing a descriptive name.",
    "aria-text": "A text-only accessibility role is incorrectly applied to an element that users need to interact with.",
    "aria-treeitem-name": "An item inside a navigation tree is missing a name.",
    "presentation-role-conflict": "An element meant to be completely ignored by screen readers still has keyboard focus enabled, causing a ghost element.",
    "label-content-name-mismatch": "The visible text of a button doesn't match the hidden text provided to screen readers, causing a massive disconnect for speech-to-text users.",
    "summary-name": "An expandable details/summary box is missing a descriptive name.",
    "hidden-content": "Content is hidden from normal view but still aggressively accessible to screen readers in a confusing way.",
    "aria-roledescription": "A custom role description is being used on an element that doesn't have a proper role assigned to it.",
    "duplicate-id-active": "Interactive elements are sharing the same ID code.",
    "duplicate-id": "Elements on the page are sharing the same ID code, which can cause structural issues."
};

// Safely fetches Layman text or falls back to technical description if entirely new rules are added to Axe in the future
function getLaymanText(violation) {
    if (laymanDictionary[violation.id]) {
        return laymanDictionary[violation.id];
    }

    // Developer helper: Warns in the console if an untranslated ID ever slips through
    console.warn(`[Odin-I] Untranslated Axe rule found: "${violation.id}"`);

    return violation.description;
}