document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.getElementById('theme-toggle');
    const appContainer = document.getElementById('app-container');
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const loadingView = document.getElementById('loading-view');
    const resultView = document.getElementById('result-view');
    const generateBtn = document.getElementById('generate-btn');
    const backBtn = document.getElementById('back-btn');
    const resetBtn = document.getElementById('reset-btn');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const dropdown1 = document.getElementById('dropdown1');
    const dropdown2 = document.getElementById('dropdown2');
    const customWordInput = document.getElementById('custom-word-input');
    const words1Input = document.getElementById('words1');
    const words2Input = document.getElementById('words2');
    const customPromptInput = document.getElementById('custom-prompt-input');
    const apiKeyInput = document.getElementById('api-key-input');
    const creativitySlider = document.getElementById('creativity-slider');
    const creativityValue = document.getElementById('creativity-value');
    const generatedTopicEl = document.getElementById('generated-topic');

    // Default words
    const defaultWords = {
        words1: ['Fear', 'Failure', 'Success', 'Joy', 'Courage', 'Technology'],
        words2: ['Publicly', 'Privately', 'Silently', 'Loudly', 'Unexpectedly', 'Intentionally']
    };

    // Default Custom Prompt Add-on
    const defaultCustomPrompt = "Ensure the question is engaging, coherent, and makes sense. Reply with a single topic only.";

    // --- State Management ---
    let words = {};

    function saveWordsToLocalStorage() {
        localStorage.setItem('tableTopicsWords', JSON.stringify(words));
    }

    function loadWordsFromLocalStorage() {
        const savedWords = localStorage.getItem('tableTopicsWords');
        if (savedWords) {
            words = JSON.parse(savedWords);
        } else {
            words = { ...defaultWords };
        }
    }

    // --- UI Population ---
    function populateDropdowns() {
        populateDropdown(dropdown1, words.words1);
        populateDropdown(dropdown2, words.words2);
    }

    function populateDropdown(dropdown, wordList) {
        dropdown.innerHTML = '';
        wordList.forEach(word => {
            const option = document.createElement('option');
            option.value = word;
            option.textContent = word;
            dropdown.appendChild(option);
        });
    }
    
    function populateSettingsInputs() {
        words1Input.value = words.words1.join(', ');
        words2Input.value = words.words2.join(', ');
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        customPromptInput.value = localStorage.getItem('tableTopicsCustomPrompt') || defaultCustomPrompt;
    }


    // --- View Switching ---
    function showView(view) {
        mainView.style.display = 'none';
        loadingView.style.display = 'none';
        resultView.style.display = 'none';
        
        if (view === 'main') mainView.style.display = 'block';
        else if (view === 'loading') loadingView.style.display = 'block';
        else if (view === 'result') resultView.style.display = 'block';
    }

    // --- Topic Generation ---
    async function generateTopic() {
        const word1 = dropdown1.value;
        const word2 = dropdown2.value;
        const word3 = customWordInput.value.trim();
        const creativity = parseInt(creativitySlider.value); // 0 to 12
        const temperature = creativity / 12; // Map 0-12 to 0.0-1.0 for API
        const apiKey = localStorage.getItem('geminiApiKey');
        const customPromptAddOn = localStorage.getItem('tableTopicsCustomPrompt') || defaultCustomPrompt;

        if (!word3) {
            generatedTopicEl.textContent = "Please enter a word in the text box.";
            return;
        }

        if (apiKey) {
            // Real AI Call
            try {
                const prompt = `Create a table topic question incorporating these words: "${word1}", "${word2}", and "${word3}". Max word limit is 30. The difficulty level is set to ${creativity} on a scale of 0 to 12 (simulating a dice roll). A low number means an easy/literal question. A high number (like rolling a 12) means a highly abstract, difficult, or metaphorical question. ${customPromptAddOn}`;
                
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: temperature }
                    })
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        throw new Error("Free tier rate limit reached. Please wait a minute.");
                    }
                    let errorMessage = `API Error (${response.status})`;
                    try {
                        const errorData = await response.json();
                        if (errorData.error?.message) errorMessage = errorData.error.message;
                    } catch (e) {}
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                if (data.candidates && data.candidates[0].content) {
                    generatedTopicEl.textContent = data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("No content generated");
                }
            } catch (error) {
                console.error(error);
                generatedTopicEl.textContent = `AI Error: ${error.message}`;
            }
        } else {
            // Fallback Templates
            const templates = [
                `Discuss the connection between ${word1} and ${word3}, and how it relates to acting ${word2}.`,
                `Share a story that involves ${word1}, ${word3}, and happening ${word2}.`,
                `How does ${word1} impact ${word3} when experienced ${word2}?`,
                `What if ${word1} and ${word3} were combined ${word2}?`,
                `Explore the idea of ${word1} versus ${word3} in a context that is ${word2}.`
            ];
            generatedTopicEl.textContent = templates[Math.floor(Math.random() * templates.length)];
        }
    }


    // --- Event Listeners ---
    themeToggle.addEventListener('change', () => {
        const isChecked = themeToggle.checked;
        document.body.dataset.theme = isChecked ? 'light' : 'dark';
        localStorage.setItem('theme', document.body.dataset.theme);
    });

    generateBtn.addEventListener('click', async () => {
        showView('loading');
        await generateTopic();
        showView('result');
    });

    backBtn.addEventListener('click', () => {
        showView('main');
    });

    resetBtn.addEventListener('click', () => {
        showView('main');
    });

    openSettingsBtn.addEventListener('click', () => {
        populateSettingsInputs();
        settingsView.style.display = 'block';
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        settingsView.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', () => {
        words = {
            words1: words1Input.value.split(',').map(w => w.trim()).filter(Boolean),
            words2: words2Input.value.split(',').map(w => w.trim()).filter(Boolean)
        };
        localStorage.setItem('geminiApiKey', apiKeyInput.value.trim());
        localStorage.setItem('tableTopicsCustomPrompt', customPromptInput.value.trim());
        
        saveWordsToLocalStorage();
        populateDropdowns();
        settingsView.style.display = 'none';
    });

    creativitySlider.addEventListener('input', (e) => {
        creativityValue.textContent = e.target.value;
    });


    // --- Initialization ---
    function init() {
        // Set theme from local storage or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.dataset.theme = savedTheme;
        themeToggle.checked = savedTheme === 'light';

        // Load words and populate UI
        loadWordsFromLocalStorage();
        populateDropdowns();
        showView('main');
    }

    init();
});
