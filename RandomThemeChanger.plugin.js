/**
 * @name RandomThemeChanger
 * @author DaddyBoard
 * @version 1.3
 * @description Changes Discord themes randomly at a customizable interval, with theme selection options and optional notifications.
 * @website https://github.com/DaddyBoard/RandomThemeChanger
 * @source https://raw.githubusercontent.com/DaddyBoard/RandomThemeChanger/main/RandomThemeChanger.plugin.js
 */

const config = {
    info: {
        name: "RandomThemeChanger",
        authors: [{ name: "DaddyBoard" }],
        version: "1.3",
        description: "Changes Discord themes randomly at a customizable interval, with theme selection options and optional notifications."
    },
    defaultConfig: [
        {
            type: "slider",
            id: "switchInterval",
            name: "Switch Interval (minutes)",
            note: "How often to switch themes (in minutes)",
            value: 60,
            min: 1,
            max: 1440,
            markers: [1, 5, 15, 30, 60, 120, 240, 480, 720, 1440],
            stickToMarkers: false
        }
    ]
};

module.exports = class RandomThemeChanger {
    constructor() {
        this.interval = null;
        this.currentThemeId = null;
        this.enabledThemes = {};
        this.showToast = true;
    }

    start() {
        this.loadSettings();
        this.changeTheme();
        this.startInterval();
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    startInterval() {
        const intervalMinutes = this.settings.switchInterval;
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => this.changeTheme(), intervalMinutes * 60 * 1000);
    }

    changeTheme() {
        const themes = BdApi.Themes.getAll().filter(theme => this.enabledThemes[theme.id] !== false);
        if (themes.length === 0) return;

        if (this.currentThemeId) {
            BdApi.Themes.disable(this.currentThemeId);
        }

        let newTheme;
        do {
            newTheme = themes[Math.floor(Math.random() * themes.length)];
        } while (themes.length > 1 && newTheme.id === this.currentThemeId);

        BdApi.Themes.enable(newTheme.id);
        this.currentThemeId = newTheme.id;

        console.log(`Changed theme to: ${newTheme.name}`);
        if (this.showToast) {
            BdApi.showToast(`Changed theme to: ${newTheme.name}`);
        }
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "10px";
        panel.style.color = "white";

       
        const style = document.createElement('style');
        style.textContent = `
            .rtp-settings-panel h3 {
                color: white;
                margin-top: 15px;
                margin-bottom: 10px;
            }
            .rtp-settings-panel label {
                color: white;
                margin-left: 5px;
            }
            .rtp-settings-panel input[type="range"] {
                width: 200px;
            }
            .rtp-theme-toggle, .rtp-toast-toggle {
                margin-bottom: 5px;
            }
        `;
        panel.appendChild(style);

        panel.classList.add('rtp-settings-panel');

        
        const sliderContainer = document.createElement("div");
        sliderContainer.innerHTML = `
            <h3>Switch Interval (minutes)</h3>
            <input type="range" id="switchIntervalSlider" min="1" max="1440" value="${this.settings.switchInterval}">
            <span id="switchIntervalValue">${this.settings.switchInterval}</span>
        `;
        panel.appendChild(sliderContainer);

        const slider = sliderContainer.querySelector("#switchIntervalSlider");
        const sliderValue = sliderContainer.querySelector("#switchIntervalValue");
        slider.addEventListener("input", () => {
            const value = parseInt(slider.value);
            sliderValue.textContent = value;
            this.settings.switchInterval = value;
            this.saveSettings();
            this.startInterval();
        });

        
        const toastToggle = document.createElement("div");
        toastToggle.classList.add('rtp-toast-toggle');
        toastToggle.innerHTML = `
            <h3>Notifications</h3>
            <label>
                <input type="checkbox" id="toastToggle" ${this.showToast ? 'checked' : ''}>
                Show toast notification when theme changes
            </label>
        `;
        panel.appendChild(toastToggle);

        const toastCheckbox = toastToggle.querySelector("#toastToggle");
        toastCheckbox.addEventListener("change", () => {
            this.showToast = toastCheckbox.checked;
            this.saveSettings();
        });

     
        const themesContainer = document.createElement("div");
        themesContainer.innerHTML = "<h3>Themes to Include</h3>";
        BdApi.Themes.getAll().forEach(theme => {
            const themeToggle = document.createElement("div");
            themeToggle.classList.add('rtp-theme-toggle');

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `theme-${theme.id}`;
            checkbox.checked = this.enabledThemes[theme.id] !== false;
            checkbox.addEventListener("change", () => {
                this.enabledThemes[theme.id] = checkbox.checked;
                this.saveSettings();
            });

            const label = document.createElement("label");
            label.htmlFor = `theme-${theme.id}`;
            label.textContent = theme.name;

            themeToggle.appendChild(checkbox);
            themeToggle.appendChild(label);
            themesContainer.appendChild(themeToggle);
        });
        panel.appendChild(themesContainer);

        return panel;
    }

    loadSettings() {
        this.settings = BdApi.Data.load(config.info.name, "settings") || {};
        if (!this.settings.switchInterval) this.settings.switchInterval = 60;
        this.enabledThemes = BdApi.Data.load(config.info.name, "enabledThemes") || {};
        this.showToast = BdApi.Data.load(config.info.name, "showToast") ?? true; // Load toast setting, default to true
    }

    saveSettings() {
        BdApi.Data.save(config.info.name, "settings", this.settings);
        BdApi.Data.save(config.info.name, "enabledThemes", this.enabledThemes);
        BdApi.Data.save(config.info.name, "showToast", this.showToast); // Save toast setting
    }
}
