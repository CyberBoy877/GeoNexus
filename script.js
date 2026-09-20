/* =========================================================
   GeoNexus — Interactive World Explorer
========================================================= */


/* =========================
   GLOBAL VARIABLES
========================= */

let countriesData = [];
let worldFeatures = [];

let svg;
let projection;
let path;

let selectedFeature = null;


/* =========================
   DOM ELEMENTS
========================= */

const mapElement =
    document.getElementById("map");

const countryInfo =
    document.getElementById("country-info");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const searchSuggestions =
    document.getElementById("searchSuggestions");

const resetButton =
    document.getElementById("resetButton");

const mapStatus =
    document.getElementById("mapStatus");

const themeToggle =
    document.getElementById("themeToggle");


/* =========================
   COUNTRY NAME NORMALIZATION
========================= */

function normalizeName(name) {

    if (!name) {
        return "";
    }

    return String(name)
        .toLowerCase()
        .trim()
        .replace(/[’']/g, "")
        .replace(/\s+/g, " ");
}


/* =========================
   COUNTRY ALIASES
========================= */

const countryAliases = {

    "democratic republic of the congo":
        [
            "democratic republic of the congo",
            "democratic republic of congo",
            "drc",
            "dr congo",
            "congo-kinshasa"
        ],

    "republic of the congo":
        [
            "republic of the congo",
            "republic of congo",
            "congo-brazzaville"
        ],

    "cote divoire":
        [
            "cote divoire",
            "ivory coast",
            "côte divoire"
        ],

    "czechia":
        [
            "czechia",
            "czech republic"
        ],

    "eswatini":
        [
            "eswatini",
            "swaziland"
        ],

    "myanmar":
        [
            "myanmar",
            "burma"
        ],

    "cabo verde":
        [
            "cabo verde",
            "cape verde"
        ],

    "timor-leste":
        [
            "timor-leste",
            "east timor"
        ],

    "north macedonia":
        [
            "north macedonia",
            "macedonia"
        ]
};


/* =========================
   GET ALIAS GROUP
========================= */

function getAliasGroup(name) {

    const normalized =
        normalizeName(name);

    for (const key in countryAliases) {

        if (
            countryAliases[key]
                .map(normalizeName)
                .includes(normalized)
        ) {
            return countryAliases[key];
        }
    }

    return [normalized];
}


/* =========================
   FIND COUNTRY
========================= */

function findCountry(searchName) {

    if (!searchName) {
        return null;
    }

    const target =
        normalizeName(searchName);

    const aliases =
        getAliasGroup(target);

    return countriesData.find(country => {

        const names = [

            country.name?.common,

            country.name?.official,

            ...(country.altSpellings || [])

        ]
        .filter(Boolean)
        .map(normalizeName);


        const codes = [

            country.cca2,

            country.cca3

        ]
        .filter(Boolean)
        .map(normalizeName);


        if (
            names.includes(target) ||
            codes.includes(target)
        ) {
            return true;
        }


        return aliases.some(alias =>
            names.includes(alias)
        );
    });
}


/* =========================
   LOAD DATA
========================= */

async function loadData() {

    try {

        mapStatus.textContent =
            "Loading geographic data...";


        const [
            countryResponse,
            worldResponse
        ] = await Promise.all([

            fetch("data/countries.json"),

            fetch(
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
            )

        ]);


        if (!countryResponse.ok) {
            throw new Error(
                "Could not load countries.json"
            );
        }


        if (!worldResponse.ok) {
            throw new Error(
                "Could not load world map"
            );
        }


        countriesData =
            await countryResponse.json();


        const worldTopology =
            await worldResponse.json();


        worldFeatures =
            topojson.feature(
                worldTopology,
                worldTopology.objects.countries
            ).features;


        drawMap();


        mapStatus.textContent =
            `${worldFeatures.length} regions available`;


        document
            .querySelector(".loading-screen")
            ?.remove();


    } catch (error) {

        console.error(error);

        mapStatus.textContent =
            "Map failed to load";

        mapElement.innerHTML = `

            <div class="error-message">

                <strong>
                    Unable to load the world map.
                </strong>

                <p style="margin-top:8px;">
                    Please refresh the page and try again.
                </p>

            </div>

        `;
    }
}


/* =========================
   DRAW MAP
========================= */

function drawMap() {

    mapElement.innerHTML = "";


    const width =
        mapElement.clientWidth;

    const height =
        mapElement.clientHeight;


    svg = d3
        .select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr(
            "viewBox",
            `0 0 ${width} ${height}`
        )
        .attr("preserveAspectRatio", "xMidYMid meet");


    projection =
        d3.geoNaturalEarth1()
            .fitExtent(
                [
                    [15, 15],
                    [width - 15, height - 15]
                ],
                {
                    type: "FeatureCollection",
                    features: worldFeatures
                }
            );


    path =
        d3.geoPath()
            .projection(projection);


    svg
        .selectAll(".country")
        .data(worldFeatures)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)

        .attr(
            "aria-label",
            feature =>
                getMapCountryName(feature)
        )

        .on("click", function(event, feature) {

            selectMapCountry(
                feature,
                this
            );

        })

        .on("mouseover", function(event, feature) {

            mapStatus.textContent =
                getMapCountryName(feature);

        })

        .on("mouseout", function() {

            mapStatus.textContent =
                `${worldFeatures.length} regions available`;

        });


    window.addEventListener(
        "resize",
        resizeMap
    );
}


/* =========================
   MAP COUNTRY NAME
========================= */

function getMapCountryName(feature) {

    return (
        feature.properties?.name ||
        feature.properties?.NAME ||
        feature.properties?.name_long ||
        "Unknown region"
    );
}


/* =========================
   SELECT MAP COUNTRY
========================= */

function selectMapCountry(
    feature,
    element
) {

    d3
        .selectAll(".country")
        .classed(
            "selected-country",
            false
        );


    d3
        .select(element)
        .classed(
            "selected-country",
            true
        );


    selectedFeature = feature;


    const mapName =
        getMapCountryName(feature);


    const country =
        findCountry(mapName);


    if (country) {

        showCountryInfo(country);

        mapStatus.textContent =
            country.name.common;

    } else {

        showUnavailableInfo(
            mapName
        );

        mapStatus.textContent =
            mapName;
    }


    countryInfo.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================
   SHOW COUNTRY INFORMATION
========================= */

function showCountryInfo(country) {

    const capital =
        country.capital?.length
            ? country.capital.join(", ")
            : "No capital listed";


    const region =
        country.region ||
        "Unknown";


    const area =
        country.area
            ? `${formatNumber(country.area)} km²`
            : "Not available";


    const currency =
        getCurrencies(country);


    const languages =
        getLanguages(country);


    const flag =
        country.flag ||
        "🌍";


    const commonName =
        country.name?.common ||
        "Unknown country";


    const officialName =
        country.name?.official ||
        commonName;


    countryInfo.className =
        "country-info";


    countryInfo.innerHTML = `

        <div class="country-header">

            <div class="country-icon">
                ${flag}
            </div>

            <div>

                <h2>
                    ${escapeHTML(commonName)}
                </h2>

                <p>
                    ${escapeHTML(officialName)}
                </p>

            </div>

        </div>


        <div class="country-details">


            <div class="info-card">

                <span>🏛️</span>

                <strong>
                    Capital
                </strong>

                <p>
                    ${escapeHTML(capital)}
                </p>

            </div>


            <div class="info-card">

                <span>🌎</span>

                <strong>
                    Region
                </strong>

                <p>
                    ${escapeHTML(region)}
                </p>

            </div>


            <div class="info-card">

                <span>📐</span>

                <strong>
                    Area
                </strong>

                <p>
                    ${escapeHTML(area)}
                </p>

            </div>


            <div class="info-card">

                <span>💰</span>

                <strong>
                    Currency
                </strong>

                <p>
                    ${escapeHTML(currency)}
                </p>

            </div>


        </div>


        <div class="info-card" style="margin-bottom:20px;">

            <span>🗣️</span>

            <strong>
                Languages
            </strong>

            <p>
                ${escapeHTML(languages)}
            </p>

        </div>


        <button
            class="explore-button"
            onclick="exploreCountry('${escapeQuotes(commonName)}')"
        >
            🔎 Search this country
        </button>

    `;
}


/* =========================
   UNAVAILABLE INFORMATION
========================= */

function showUnavailableInfo(name) {

    countryInfo.className =
        "country-info";


    countryInfo.innerHTML = `

        <div class="country-header">

            <div class="country-icon">
                🌍
            </div>

            <div>

                <h2>
                    ${escapeHTML(name)}
                </h2>

                <p>
                    Geographic region selected
                </p>

            </div>

        </div>


        <div class="error-message">

            <strong>
                Detailed information is not available.
            </strong>

            <p style="margin-top:8px;">
                This region is present on the interactive
                map, but its detailed record could not be
                matched in the current database.
            </p>

        </div>

    `;
}


/* =========================
   CURRENCIES
========================= */

function getCurrencies(country) {

    if (!country.currencies) {
        return "Not available";
    }


    const currencies =
        Object.values(country.currencies);


    if (!currencies.length) {
        return "Not available";
    }


    return currencies
        .map(currency => {

            const name =
                currency.name ||
                "Unknown";

            const symbol =
                currency.symbol
                    ? ` (${currency.symbol})`
                    : "";

            return `${name}${symbol}`;

        })
        .join(", ");
}


/* =========================
   LANGUAGES
========================= */

function getLanguages(country) {

    if (!country.languages) {
        return "Not available";
    }


    const languages =
        Object.values(country.languages);


    if (!languages.length) {
        return "Not available";
    }


    return languages.join(", ");
}


/* =========================
   FORMAT NUMBERS
========================= */

function formatNumber(number) {

    if (
        number === undefined ||
        number === null ||
        number === 0
    ) {
        return "Not available";
    }


    return Number(number)
        .toLocaleString();
}


/* =========================
   SEARCH
========================= */

function searchCountry() {

    const query =
        searchInput.value.trim();


    if (!query) {

        searchInput.focus();

        return;
    }


    const country =
        findCountry(query);


    if (!country) {

        showUnavailableInfo(
            query
        );

        searchSuggestions
            .classList
            .remove("show");

        return;
    }


    showCountryInfo(country);


    searchSuggestions
        .classList
        .remove("show");


    highlightMapCountry(
        country
    );


    countryInfo.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================
   HIGHLIGHT SEARCHED COUNTRY
========================= */

function highlightMapCountry(country) {

    d3
        .selectAll(".country")
        .classed(
            "selected-country",
            false
        );


    const targetNames = [

        country.name?.common,

        country.name?.official,

        ...(country.altSpellings || [])

    ]
    .filter(Boolean)
    .map(normalizeName);


    d3
        .selectAll(".country")
        .each(function(feature) {

            const mapName =
                normalizeName(
                    getMapCountryName(feature)
                );


            if (
                targetNames.includes(mapName)
            ) {

                d3
                    .select(this)
                    .classed(
                        "selected-country",
                        true
                    );
            }

        });
}


/* =========================
   SEARCH SUGGESTIONS
========================= */

function updateSuggestions() {

    const query =
        normalizeName(
            searchInput.value
        );


    if (
        !query ||
        !countriesData.length
    ) {

        searchSuggestions
            .classList
            .remove("show");

        return;
    }


    const results =
        countriesData
            .filter(country => {

                const common =
                    normalizeName(
                        country.name?.common
                    );

                const official =
                    normalizeName(
                        country.name?.official
                    );

                return (
                    common.includes(query) ||
                    official.includes(query)
                );

            })
            .slice(0, 6);


    if (!results.length) {

        searchSuggestions
            .classList
            .remove("show");

        return;
    }


    searchSuggestions.innerHTML =
        results
            .map(country => `

                <button
                    class="suggestion"
                    data-name="${escapeHTML(
                        country.name.common
                    )}"
                >

                    <span class="suggestion-name">

                        ${country.flag || "🌍"}

                        ${escapeHTML(
                            country.name.common
                        )}

                    </span>

                    <span class="suggestion-code">

                        ${country.cca3 || ""}

                    </span>

                </button>

            `)
            .join("");


    searchSuggestions
        .classList
        .add("show");


    document
        .querySelectorAll(".suggestion")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    searchInput.value =
                        button.dataset.name;

                    searchCountry();

                }
            );

        });
}


/* =========================
   EXPLORE COUNTRY
========================= */

function exploreCountry(name) {

    searchInput.value =
        name;

    searchCountry();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================
   RESET
========================= */

function resetMap() {

    searchInput.value = "";

    searchSuggestions
        .classList
        .remove("show");


    d3
        .selectAll(".country")
        .classed(
            "selected-country",
            false
        );


    selectedFeature = null;


    countryInfo.className =
        "country-info empty-state";


    countryInfo.innerHTML = `

        <div class="empty-icon">
            🌍
        </div>

        <h2>
            Select a country
        </h2>

        <p>
            Click a country on the map to explore
            its geographic information.
        </p>

    `;


    mapStatus.textContent =
        `${worldFeatures.length} regions available`;
}


/* =========================
   RESIZE MAP
========================= */

function resizeMap() {

    if (
        !svg ||
        !worldFeatures.length
    ) {
        return;
    }


    const width =
        mapElement.clientWidth;

    const height =
        mapElement.clientHeight;


    svg
        .attr("width", width)
        .attr("height", height)
        .attr(
            "viewBox",
            `0 0 ${width} ${height}`
        );


    projection =
        d3.geoNaturalEarth1()
            .fitExtent(
                [
                    [15, 15],
                    [width - 15, height - 15]
                ],
                {
                    type: "FeatureCollection",
                    features: worldFeatures
                }
            );


    path =
        d3.geoPath()
            .projection(projection);


    svg
        .selectAll(".country")
        .attr("d", path);
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   ESCAPE QUOTES
========================= */

function escapeQuotes(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


/* =========================
   THEME
========================= */

function setupTheme() {

    const savedTheme =
        localStorage.getItem(
            "geonexus-theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeToggle.textContent =
            "☀️";
    }


    themeToggle.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const dark =
                document.body.classList.contains(
                    "dark"
                );


            themeToggle.textContent =
                dark
                    ? "☀️"
                    : "🌙";


            localStorage.setItem(
                "geonexus-theme",
                dark
                    ? "dark"
                    : "light"
            );

        }
    );
}


/* =========================
   EVENT LISTENERS
========================= */

searchButton.addEventListener(
    "click",
    searchCountry
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            searchCountry();

        }

    }
);


searchInput.addEventListener(
    "input",
    updateSuggestions
);


document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".search-wrapper"
            )
        ) {

            searchSuggestions
                .classList
                .remove("show");

        }

    }
);


resetButton.addEventListener(
    "click",
    resetMap
);


document
    .querySelectorAll(
        ".quick-searches button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                searchInput.value =
                    button.dataset.country;

                searchCountry();

            }
        );

    });


/* =========================
   START APPLICATION
========================= */

setupTheme();

loadData();
 
