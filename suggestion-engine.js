// ==UserScript==
// @name         Commons Upload Wizard Suggestion Engine
// @namespace    https://commons.wikimedia.org
// @version      0.1.0
// @description  Enhances the Wikimedia Commons Upload Wizard with intelligent category suggestions based on location and nearby content. The script analyzes image geolocation to provide relevant categories, making uploads more efficient and accurate.
// @author       Daanvr
// @match        https://commons.wikimedia.org/wiki/Special:UploadWizard*
// @grant        none
// @license      MIT
// ==/UserScript==

/*
 * Commons Upload Wizard Suggestion Engine
 * A user script to enhance the Wikimedia Commons upload process with intelligent suggestions
 * 
 * GitHub Repository: https://github.com/daanvr/Suggestion-Engine-Commons
 * Commons User Page: https://commons.wikimedia.org/wiki/User:Daanvr
 * 
 * This script helps you categorize your uploads by:
 * - Suggesting categories based on nearby files (within configurable radius)
 * - Displaying distance and frequency information for suggestions
 * 
 * Found a bug or have a suggestion? Visit:
 * https://github.com/daanvr/Suggestion-Engine-Commons/issues
 */

// Configurable Parameters
const CONFIG = {
    // API and Performance
    NEARBY_FILES_LIMIT: 50,       // Number of nearby files to analyze
    RETRY_COOLDOWN: 3000,         // Milliseconds to wait before allowing retry
    SUGGESTION_RADIUS: 10000,      // Radius in meters for nearby file search
    API_TIMEOUT: 10000,           // Milliseconds before timing out API calls
};

/* Version History
 * 0.2.0 - Added main subject suggestions
 * 0.1.0 - Initial release with category suggestions
 */

class SuggestionEngine {
    constructor() {
        this.api = new mw.Api();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            await mw.loader.using(['mediawiki.api', 'oojs-ui']);
            await this.waitForElement('.mwe-upwiz-categoriesDetailsWidget');
            await this.waitForElement('.wbmi-statement-input');
            this.attachToDetailsPanel();
            this.attachToSubjectsPanel();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize SuggestionEngine:', error);
        }
    }

    waitForElement(selector) {
        return new Promise((resolve) => {
            const check = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }

    attachToDetailsPanel() {
        const categoryWidgets = document.querySelectorAll('.mwe-upwiz-categoriesDetailsWidget');
        
        categoryWidgets.forEach((widget) => {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '8px';
            buttonContainer.style.marginBottom = '8px';

            const suggestionPanel = document.createElement('div');
            suggestionPanel.className = 'category-suggestions-panel';
            suggestionPanel.style.display = 'none';
            suggestionPanel.style.marginTop = '8px';
            suggestionPanel.style.border = '1px solid #a2a9b1';
            suggestionPanel.style.borderRadius = '2px';
            suggestionPanel.style.padding = '8px';
            suggestionPanel.style.backgroundColor = '#f8f9fa';

            const suggestionButton = new OO.ui.ButtonWidget({
                label: 'Suggest Categories',
                icon: 'search',
                flags: ['progressive'],
                framed: true
            });

            const container = this.findParentFileContainer(widget);
            
            const boundHandler = async () => {
                const coordinates = this.getCoordinates(container);
                console.debug('Subject suggestion coordinates:', coordinates); // Add this line
                if (!coordinates) {
                    this.showMessage(container, 'warning', 'Please enter both latitude and longitude to get subject suggestions.');
                    return;
                }
            
                suggestionPanel.innerHTML = '';
                const progressBar = new OO.ui.ProgressBarWidget({
                    progress: false
                });
                suggestionPanel.appendChild(progressBar.$element[0]);
                suggestionPanel.style.display = 'block';
            
                try {
                    const [nearbyCategories, frequentCategories] = await Promise.all([
                        this.fetchNearbyCategories(coordinates),
                        this.fetchFrequentCategories(coordinates)
                    ]);
            
                    this.displaySuggestions(container, suggestionPanel, nearbyCategories, frequentCategories);
                } catch (error) {
                    console.error('Failed to fetch category suggestions:', error);
                    this.showMessage(container, 'error', 'Failed to fetch category suggestions. Please try again.');
                    suggestionPanel.style.display = 'none';
                }
            };
            suggestionButton.on('click', boundHandler);

            buttonContainer.appendChild(suggestionButton.$element[0]);
            widget.parentElement.insertBefore(buttonContainer, widget.nextSibling);
            widget.parentElement.insertBefore(suggestionPanel, buttonContainer.nextSibling);
        });
    }

    findParentFileContainer(element) {
        let current = element;
        while (current && !current.classList.contains('mwe-upwiz-info-file')) {
            current = current.parentElement;
        }
        return current;
    }

    getCoordinates(container) {
        if (!container) {
            console.debug('No container found');
            return null;
        }
    
        const locationSection = container.querySelector('.mwe-upwiz-locationDetailsWidget');
        if (!locationSection) {
            console.debug('No location section found');
            return null;
        }
    
        // Find fields by label text
        const fields = Array.from(locationSection.querySelectorAll('.oo-ui-fieldLayout'));
        const latField = fields.find(field => 
            field.querySelector('.oo-ui-labelElement-label')?.textContent.trim() === 'Latitude'
        );
        const lonField = fields.find(field => 
            field.querySelector('.oo-ui-labelElement-label')?.textContent.trim() === 'Longitude'
        );
    
        if (!latField || !lonField) {
            console.debug('Lat/lon fields not found');
            return null;
        }
    
        const latInput = latField.querySelector('input');
        const lonInput = lonField.querySelector('input');
    
        if (!latInput || !lonInput) {
            console.debug('Lat/lon inputs not found');
            return null;
        }
    
        const lat = latInput.value.trim();
        const lon = lonInput.value.trim();
    
        if (!lat || !lon) {
            console.debug('No lat/lon values found');
            return null;
        }
    
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
    
        if (isNaN(latNum) || isNaN(lonNum)) {
            console.debug('Invalid lat/lon numbers');
            return null;
        }
    
        if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
            console.debug('Lat/lon out of range');
            return null;
        }
    
        console.debug('Coordinates found:', { lat: latNum, lon: lonNum });
        return {
            lat: Number(latNum.toFixed(5)),
            lon: Number(lonNum.toFixed(5))
        };
    }

    async fetchNearbyCategories({ lat, lon }) {
        try {
            console.debug('Fetching nearby categories for coordinates:', { lat, lon });
            const response = await this.api.get({
                action: 'query',
                list: 'geosearch',
                gsnamespace: 14,
                gsradius: CONFIG.SUGGESTION_RADIUS,
                gscoord: `${lat}|${lon}`,
                gslimit: CONFIG.NEARBY_FILES_LIMIT,
                format: 'json'
            });
            console.debug('Nearby categories API response:', response);
            return response.query?.geosearch || [];
        } catch (error) {
            console.error('Failed to fetch nearby categories:', error);
            return [];
        }
    }

    isHiddenCategory(categoryName) {
        return this.hiddenCategoryPatterns.some(pattern => 
            categoryName.toLowerCase().includes(pattern.toLowerCase())
        );
    }

      async fetchFrequentCategories({ lat, lon }) {
        try {
            const nearbyFiles = await this.api.get({
                action: 'query',
                list: 'geosearch',
                gsnamespace: 6,
                gsradius: 5000,
                gscoord: `${lat}|${lon}`,
                gslimit: 50,
                format: 'json'
            });

            const pageIds = nearbyFiles.query?.geosearch?.map(file => file.pageid) || [];
            if (!pageIds.length) return [];

            const categoryData = await this.api.get({
                action: 'query',
                pageids: pageIds.join('|'),
                prop: 'categories',
                clshow: '!hidden', // This parameter excludes hidden categories
                cllimit: 'max',
                format: 'json'
            });

            const categoryCounts = {};
            Object.values(categoryData.query?.pages || {}).forEach(page => {
                page.categories?.forEach(cat => {
                    const name = cat.title.replace('Category:', '');
                    categoryCounts[name] = (categoryCounts[name] || 0) + 1;
                });
            });

            return Object.entries(categoryCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 25);
        } catch (error) {
            console.error('Failed to fetch frequent categories:', error);
            return [];
        }
    }


    displaySuggestions(container, panel, nearby, frequent) {
        panel.innerHTML = '';
        panel.style.display = 'block';

        const createSection = (title, items, formatter) => {
            const section = document.createElement('div');
            section.className = 'category-suggestion-section';
            section.style.marginBottom = '1em';

            const heading = new OO.ui.LabelWidget({
                label: title,
                classes: ['mwe-upwiz-details-fieldname']
            });
            heading.$element.css('margin-bottom', '0.5em');
            section.appendChild(heading.$element[0]);

            const list = document.createElement('div');
            list.style.display = 'flex';
            list.style.flexWrap = 'wrap';
            list.style.gap = '4px';

            items.forEach(item => {
                const button = new OO.ui.ButtonWidget({
                    label: formatter(item),
                    framed: false,
                    flags: ['progressive']
                });

                const boundAddCategory = () => this.addCategory(container, item);
                button.on('click', () => {
                    boundAddCategory();
                    button.setFlags({ progressive: false, successful: true });
                });

                list.appendChild(button.$element[0]);
            });

            section.appendChild(list);
            return section;
        };

        if (!nearby.length && !frequent.length) {
            const message = new OO.ui.MessageWidget({
                type: 'notice',
                label: 'No categories found nearby. Try adjusting the coordinates.'
            });
            panel.appendChild(message.$element[0]);
            return;
        }

        if (nearby.length) {
            panel.appendChild(createSection(
                'Nearby Categories',
                nearby,
                item => `${item.title.replace('Category:', '')} (${(item.dist/1000).toFixed(2)}km)`
            ));
        }

        if (frequent.length) {
            panel.appendChild(createSection(
                'Frequently Used Categories',
                frequent,
                ([name, count]) => `${name} (${count})`
            ));
        }

        const closeButton = new OO.ui.ButtonWidget({
            label: 'Close suggestions',
            flags: ['destructive'],
            framed: false
        });

        closeButton.on('click', () => {
            panel.style.display = 'none';
        });

        const closeContainer = document.createElement('div');
        closeContainer.style.marginTop = '8px';
        closeContainer.style.textAlign = 'right';
        closeContainer.appendChild(closeButton.$element[0]);
        panel.appendChild(closeContainer);
    }

    addCategory(container, category) {
        try {
            const categoryWidgetContainer = container.querySelector('.mwe-upwiz-categoriesDetailsWidget');
            if (!categoryWidgetContainer) {
                console.error('Category widget container not found');
                return;
            }

            const tagWidget = categoryWidgetContainer.querySelector('.oo-ui-tagMultiselectWidget');
            if (!tagWidget) {
                console.error('Tag widget not found');
                return;
            }

            const categoryName = typeof category === 'string' ? category : 
                               Array.isArray(category) ? category[0] :
                               category.title.replace('Category:', '');

            const existingTags = Array.from(
                tagWidget.querySelectorAll('.oo-ui-tagItemWidget .oo-ui-labelElement-label')
            ).map(tag => tag.textContent.trim());

            if (existingTags.includes(categoryName)) {
                return;
            }

            const tagItem = new OO.ui.TagItemWidget({
                label: categoryName,
                draggable: false
            });

            tagItem.on('remove', () => {
                tagItem.$element.remove();
            });

            const input = tagWidget.querySelector('input');
            if (!input) {
                console.error('Input not found');
                return;
            }

            input.parentElement.insertBefore(tagItem.$element[0], input);

            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);

            this.showMessage(container, 'success', `Added category: ${categoryName}`);
        } catch (error) {
            console.error('Failed to add category:', error);
            this.showMessage(container, 'error', 'Failed to add category. Please try again.');
        }
    }

    showMessage(container, type, message) {
        const widget = new OO.ui.MessageWidget({
            type: type,
            label: message
        });
        
        container.appendChild(widget.$element[0]);
        setTimeout(() => widget.$element.remove(), 5000);
    }

    async attachToSubjectsPanel() {
        const subjectWidgets = document.querySelectorAll('.wbmi-statement-input');
        
        subjectWidgets.forEach((widget) => {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '8px';
            buttonContainer.style.marginBottom = '8px';
    
            const suggestionPanel = document.createElement('div');
            suggestionPanel.className = 'subject-suggestions-panel';
            suggestionPanel.style.display = 'none';
            suggestionPanel.style.marginTop = '8px';
            suggestionPanel.style.border = '1px solid #a2a9b1';
            suggestionPanel.style.borderRadius = '2px';
            suggestionPanel.style.padding = '8px';
            suggestionPanel.style.backgroundColor = '#f8f9fa';
    
            const suggestionButton = new OO.ui.ButtonWidget({
                label: 'Suggest Subjects',
                icon: 'search',
                flags: ['progressive'],
                framed: true
            });
    
            const container = this.findParentFileContainer(widget);
            
            const boundHandler = async () => {
                const coordinates = this.getCoordinates(container);
                if (!coordinates) {
                    this.showMessage(container, 'warning', 'Please enter both latitude and longitude to get subject suggestions.');
                    return;
                }
    
                suggestionPanel.innerHTML = '';
                const progressBar = new OO.ui.ProgressBarWidget({
                    progress: false
                });
                suggestionPanel.appendChild(progressBar.$element[0]);
                suggestionPanel.style.display = 'block';
    
                try {
                    const nearbySubjects = await this.fetchNearbySubjects(coordinates);
                    this.displaySubjectSuggestions(container, suggestionPanel, nearbySubjects);
                } catch (error) {
                    console.error('Failed to fetch subject suggestions:', error);
                    this.showMessage(container, 'error', 'Failed to fetch subject suggestions. Please try again.');
                    suggestionPanel.style.display = 'none';
                }
            };
    
            suggestionButton.on('click', boundHandler);
    
            buttonContainer.appendChild(suggestionButton.$element[0]);
            widget.parentElement.insertBefore(buttonContainer, widget.nextSibling);
            widget.parentElement.insertBefore(suggestionPanel, buttonContainer.nextSibling);
        });
    }

    async fetchNearbySubjects({ lat, lon }) {
        try {
            const radius = CONFIG.SUGGESTION_RADIUS / 1000; // Convert meters to kilometers
            console.log('Fetching nearby Wikidata items for subjects:', { lat, lon });
    
            const query = `
    SELECT ?item ?itemLabel ?itemDescription ?distance WHERE {
      SERVICE wikibase:around {
        ?item wdt:P625 ?location .
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
        bd:serviceParam wikibase:radius "${radius}" .
        bd:serviceParam wikibase:distance ?distance .
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY ?distance
    LIMIT 50
    `;
            const url = 'https://query.wikidata.org/sparql';
            const fullUrl = url + '?query=' + encodeURIComponent(query);
    
            const response = await fetch(fullUrl, {
                headers: {
                    'Accept': 'application/sparql-results+json'
                }
            });
    
            if (!response.ok) {
                throw new Error(`SPARQL query failed with status ${response.status}`);
            }
    
            const data = await response.json();
    
            const bindings = data.results.bindings;
    
            const subjects = bindings.map(binding => ({
                id: binding.item.value.replace('http://www.wikidata.org/entity/', ''),
                label: binding.itemLabel?.value || '',
                description: binding.itemDescription?.value || '',
                distance: parseFloat(binding.distance.value) // Distance is in kilometers
            }));
    
            return subjects;
    
        } catch (error) {
            console.error('Failed to fetch nearby subjects:', error);
            return [];
        }
    }

    displaySubjectSuggestions(container, panel, subjects) {
        panel.innerHTML = '';
        panel.style.display = 'block';
    
        if (!subjects.length) {
            const message = new OO.ui.MessageWidget({
                type: 'notice',
                label: 'No subjects found nearby. Try adjusting the coordinates.'
            });
            panel.appendChild(message.$element[0]);
            return;
        }
    
        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '4px';
    
        subjects.forEach(subject => {
            const button = new OO.ui.ButtonWidget({
                label: `${subject.label} (${subject.distance.toFixed(2)} km)`,
                framed: false,
                flags: ['progressive']
            });
    
            // Add tooltip with description if available
            if (subject.description) {
                button.$element.attr('title', subject.description);
            }
    
            button.on('click', () => {
                this.addSubject(container, subject);
                button.setFlags({ progressive: false, successful: true });
            });
    
            list.appendChild(button.$element[0]);
        });
    
        panel.appendChild(list);
    
        // Add close button
        const closeButton = new OO.ui.ButtonWidget({
            label: 'Close suggestions',
            flags: ['destructive'],
            framed: false
        });
    
        closeButton.on('click', () => {
            panel.style.display = 'none';
        });
    
        const closeContainer = document.createElement('div');
        closeContainer.style.marginTop = '8px';
        closeContainer.style.textAlign = 'right';
        closeContainer.appendChild(closeButton.$element[0]);
        panel.appendChild(closeContainer);
    }

    addSubject(container, subject) {
        try {
            // Find the statement input widget
            const statementWidgetElement = container.querySelector('.wbmi-statement-input');
            if (!statementWidgetElement) {
                console.error('Statement widget element not found');
                return;
            }
    
            // Find the input widget element
            const inputWidgetElement = statementWidgetElement.querySelector('.wbmi-input-widget');
            if (!inputWidgetElement) {
                console.error('Input widget element not found');
                return;
            }
    
            // Infuse the OOUI widget instance from the element
            const inputWidget = OO.ui.infuse(inputWidgetElement);
            if (!inputWidget) {
                console.error('Input widget instance not found');
                return;
            }
    
            // Access the controller
            const controller = inputWidget.controller;
            if (!controller) {
                console.error('Controller not found in input widget');
                return;
            }
    
            // Check if the subject is already added
            const existingEntities = controller.getEntities();
            if (existingEntities.some(entity => entity.getId() === subject.id)) {
                console.log('Subject already added:', subject.label);
                return;
            }
    
            // Create a new entity model
            const entityModel = new wbmi.model.entity.Entity({
                id: subject.id,
                labels: { en: subject.label },
                descriptions: { en: subject.description }
            });
    
            // Add the entity to the controller
            controller.addEntities([entityModel]);
    
            this.showMessage(container, 'success', `Added subject: ${subject.label}`);
        } catch (error) {
            console.error('Failed to add subject:', error);
            this.showMessage(container, 'error', 'Failed to add subject. Please try again.');
        }
    }
}

// Initialize the suggester
(() => {
    const engine = new SuggestionEngine();

    mw.hook('wikipage.content').add(() => {
        engine.init();
    });

    mw.hook('uploadwizard.fillDestFile').add(() => {
        engine.init();
    });
})();