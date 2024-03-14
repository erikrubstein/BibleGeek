// elements
const settingsListElement = document.getElementById('settings-list');

// variables
const tokenInputHandlerSettings = {
    autofillHeaders: false,
    autofillChapters: false,
    autofillVerses: false,
    autofillPunctuation: false,
    autofillLineBreaks: false,
    autofillSpaces: false,
    autofillIndentation: false,
    autofillWords: false,
    autofillCase: false
}

function createSetting(title, description, buttons) {

    const settingContainerElement = document.createElement('div');
    settingContainerElement.classList.add('setting-container');
    settingsListElement.appendChild(settingContainerElement);

    const settingHeaderElement = document.createElement('div');
    settingHeaderElement.classList.add('setting-header');
    settingContainerElement.appendChild(settingHeaderElement);

    const settingTitleElement = document.createElement('h3');
    settingTitleElement.classList.add('setting-title');
    settingTitleElement.textContent = title;
    settingHeaderElement.appendChild(settingTitleElement);

    const settingBodyElement = document.createElement('div');
    settingBodyElement.classList.add('setting-body');
    settingContainerElement.appendChild(settingBodyElement);

    const settingDescriptionElement = document.createElement('p');
    settingDescriptionElement.classList.add('setting-description');
    settingDescriptionElement.textContent = description;
    settingBodyElement.appendChild(settingDescriptionElement);

    const settingButtonContainerElement = document.createElement('div');
    settingButtonContainerElement.classList.add('setting-button-container');
    settingBodyElement.appendChild(settingButtonContainerElement);

    let enabledButtonWrapper = null;

    for (let button of buttons) {
        const buttonElement = document.createElement('button');
        buttonElement.classList.add('setting-button');
        buttonElement.textContent = button.name;
        buttonElement.addEventListener('click', () => {

            // ignore if already enabled
            if (enabledButtonWrapper !== null && enabledButtonWrapper[0] === buttonElement)
                return;

            // disable if other is already enabled
            if (enabledButtonWrapper !== null) {
                if (enabledButtonWrapper[1].disable)
                    enabledButtonWrapper[1].disable();
                enabledButtonWrapper[0].classList.remove('enabled');
            }

            // enable
            if (button.enable)
                button.enable();
            buttonElement.classList.add('enabled');
            enabledButtonWrapper = [buttonElement, button];
        });

        // enable first button
        if (button.enabled && enabledButtonWrapper === null) {
            button.enable();
            buttonElement.classList.add('enabled');
            enabledButtonWrapper = [buttonElement, button];
        }
        settingButtonContainerElement.appendChild(buttonElement);
    }

    if (enabledButtonWrapper === null)
        throw new Error('No enabled button found');
}

function createSimpleSetting(title, description, enabled, action) {
    createSetting(title, description, [
        {
            name: "Disabled",
            enabled: !enabled,
            enable: () => action(false),
        },
        {
            name: "Enabled",
            enabled: enabled,
            enable: () => action(true),
        }
    ])
}

createSimpleSetting("Autofill Headers", "Passage Headers will be completed automatically.", true, value => tokenInputHandlerSettings.autofillHeaders = value)
createSimpleSetting("Autofill Chapters", "Chapter numbers will be completed automatically.", true, value => tokenInputHandlerSettings.autofillChapters = value)
createSimpleSetting("Autofill Verses", "Verse numbers will be completed automatically.", true, value => tokenInputHandlerSettings.autofillVerses = value)
createSimpleSetting("Autofill Punctuation", "Punctuation will be completed automatically.", true, value => tokenInputHandlerSettings.autofillPunctuation = value)
createSimpleSetting("Autofill Line Breaks", "Line breaks will be completed automatically.", true, value => tokenInputHandlerSettings.autofillLineBreaks = value)
createSimpleSetting("Autofill Spaces", "Spaces will be completed automatically.", false, value => tokenInputHandlerSettings.autofillSpaces = value)
createSimpleSetting("Autofill Indentation", "Indentation will be completed automatically.", true, value => tokenInputHandlerSettings.autofillIndentation = value)
createSimpleSetting("Autofill Words", "Words will be completed automatically.", false, value => tokenInputHandlerSettings.autofillWords = value)
createSimpleSetting("Autofill Case", "Case will be completed automatically.", true, value => tokenInputHandlerSettings.autofillCase = value)