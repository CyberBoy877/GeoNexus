const width = 1200;
const height = 520;

let countriesData = [];
let mapCountries = [];

const svg = d3
    .select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

const projection = d3
    .geoNaturalEarth1()
    .fitSize([width, height], {
        type: "Sphere"
    });

const path = d3.geoPath().projection(projection);

const mapGroup = svg.append("g");

const countryInfo = document.getElementById("country-info");


// ========================================
// LOAD DATA
// ========================================

Promise.all([
    fetch("data/countries.json").then(response => {
        if (!response.ok) {
            throw new Error("countries.json could not be loaded");
        }

        return response.json();
    }),

    fetch(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    ).then(response => {
        if (!response.ok) {
            throw new Error("World map could not be loaded");
        }

        return response.json();
    })
])
.then(([data, world]) => {

    countriesData = data;

    console.log(
        "Country database loaded:",
        countriesData.length,
        "records"
    );

    loadWorldMap(world);
})
.catch(error => {

    console.error(error);

    document.getElementById("map").innerHTML = `
        <div class="loading">
            Failed to load GeoNexus data.
        </div>
    `;
});


// ========================================
// WORLD MAP
// ========================================

function loadWorldMap(world) {

    mapCountries =
        topojson.feature(
            world,
            world.objects.countries
        ).features;

    mapGroup
        .selectAll(".country")
        .data(mapCountries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .on("click", function(event, d) {

            const mapName =
                d.properties.name;

            const country =
                findCountry(mapName);

            if (country) {
                selectCountry(country);
            } else {
                showUnknownCountry(mapName);
            }
        });

    document
        .querySelector(".loading")
        ?.remove();

    console.log(
        "World map loaded:",
        mapCountries.length,
        "map regions"
    );
}


// ========================================
// FIND COUNTRY
// ========================================

function findCountry(searchName) {

    if (!searchName) {
        return null;
    }

    const target = searchName
        .toLowerCase()
        .trim();

    // Country name aliases
    const aliases = {
        "democratic republic of the congo": "democratic republic of the congo",
        "dr congo": "democratic republic of the congo",
        "drc": "democratic republic of the congo",
        "republic of the congo": "republic of the congo",
        "congo": "republic of the congo",
        "ivory coast": "côte d'ivoire",
        "czech republic": "czechia",
        "swaziland": "eswatini",
        "burma": "myanmar",
        "cape verde": "cabo verde"
    };

    const normalizedTarget =
        aliases[target] || target;

    return countriesData.find(country => {

        const names = [
            country.name?.common,
            country.name?.official,
            ...(country.altSpellings || [])
        ]
        .filter(Boolean)
        .map(name =>
            name.toLowerCase().trim()
        );

        const codes = [
            country.cca2,
            country.cca3
        ]
        .filter(Boolean)
        .map(code =>
            code.toLowerCase().trim()
        );

        return (
            names.includes(normalizedTarget) ||
            codes.includes(normalizedTarget)
        );
    });
}
// ========================================
// SELECT COUNTRY
// ========================================

function selectCountry(country) {

    clearSelection();

    const mapName =
        country.name.common;

    const matchingPaths =
        d3.selectAll(".country")
            .filter(function(d) {

                return namesMatch(
                    d.properties.name,
                    country
                );
            });

    matchingPaths
        .classed(
            "selected-country",
            true
        );

    showCountryInfo(country);
}


// ========================================
// COUNTRY NAME MATCHING
// ========================================

function namesMatch(mapName, country) {

    const map =
        mapName
            ?.toLowerCase()
            .trim();

    const common =
        country.name?.common
            ?.toLowerCase()
            .trim();

    const official =
        country.name?.official
            ?.toLowerCase()
            .trim();

    const alternatives =
        country.altSpellings || [];

    return (
        map === common ||
        map === official ||
        alternatives.some(
            name =>
                name
                    .toLowerCase()
                    .trim() === map
        )
    );
}


// ========================================
// CLEAR MAP SELECTION
// ========================================

function clearSelection() {

    d3.selectAll(".country")
        .classed(
            "selected-country",
            false
        );
}


// ========================================
// COUNTRY INFORMATION
// ========================================

function showCountryInfo(country) {

    const capital =
        country.capital?.length
            ? country.capital.join(", ")
            : "No capital listed";

    const continent =
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
        country.flag || "🌍";

    countryInfo.innerHTML = `

        <div class="country-header">

            <div class="country-icon">
                ${flag}
            </div>

            <div>
                <h2>
                    ${country.name.common}
                </h2>

                <p>
                    ${country.name.official}
                </p>
            </div>

        </div>


        <div class="country-details">

            <div class="info-card">
                <span>🌎</span>
                <strong>Region</strong>
                <p>${continent}</p>
            </div>


            <div class="info-card">
                <span>🏛️</span>
                <strong>Capital</strong>
                <p>${capital}</p>
            </div>


            


            <div class="info-card">
                <span>📐</span>
                <strong>Area</strong>
                <p>${area}</p>
            </div>

        </div>


        <div class="country-details">

            <div class="info-card">
                <span>💰</span>
                <strong>Currency</strong>
                <p>${currency}</p>
            </div>


            <div class="info-card">
                <span>🗣️</span>
                <strong>Languages</strong>
                <p>${languages}</p>
            </div>

        </div>


        <button
            class="explore-button"
            onclick="exploreCountry(
                '${escapeQuotes(country.name.common)}'
            )"
        >
            Explore ${country.name.common}
        </button>
    `;
}


// ========================================
// CURRENCY
// ========================================

function getCurrencies(country) {

    if (!country.currencies) {
        return "Not available";
    }

    return Object.values(
        country.currencies
    )
    .map(currency => {

        if (currency.symbol) {
            return `${currency.name} (${currency.symbol})`;
        }

        return currency.name;

    })
    .join(", ");
}


// ========================================
// LANGUAGES
// ========================================

function getLanguages(country) {

    if (!country.languages) {
        return "Not available";
    }

    return Object.values(
        country.languages
    ).join(", ");
}


// ========================================
// NUMBER FORMAT
// ========================================

function formatNumber(number) {

    return new Intl.NumberFormat(
        "en-US"
    ).format(number);
}


// ========================================
// SEARCH
// ========================================

function searchCountry() {

    const input =
        document
            .getElementById("searchInput")
            .value
            .trim();

    if (!input) {

        alert(
            "Please enter a country name."
        );

        return;
    }

    const country =
        countriesData.find(item => {

            const common =
                item.name?.common
                    ?.toLowerCase();

            const official =
                item.name?.official
                    ?.toLowerCase();

            const cca2 =
                item.cca2
                    ?.toLowerCase();

            const cca3 =
                item.cca3
                    ?.toLowerCase();

            const query =
                input.toLowerCase();

            return (
                common?.includes(query) ||
                official?.includes(query) ||
                cca2 === query ||
                cca3 === query
            );
        });

    if (!country) {

        alert(
            "Country not found. Try another name."
        );

        return;
    }

    selectCountry(country);

    document
        .getElementById("country-info")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


// ========================================
// ENTER KEY SEARCH
// ========================================

document
    .getElementById("searchInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {
                searchCountry();
            }
        }
    );


// ========================================
// UNKNOWN COUNTRY
// ========================================

function showUnknownCountry(name) {

    clearSelection();

    d3.selectAll(".country")
        .filter(function(d) {

            return (
                d.properties.name === name
            );
        })
        .classed(
            "selected-country",
            true
        );

    countryInfo.innerHTML = `

        <div class="country-header">

            <div class="country-icon">
                🌍
            </div>

            <div>
                <h2>${name}</h2>

                <p>
                    Geographic region detected
                </p>
            </div>

        </div>

        <p>
            Detailed information for this
            region is not available in the
            current database.
        </p>
    `;
}


// ========================================
// EXPLORE COUNTRY
// ========================================

function exploreCountry(countryName) {

    alert(
        `${countryName} regional exploration is coming next!`
    );
}


// ========================================
// ESCAPE QUOTES
// ========================================

function escapeQuotes(text) {

    return text
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}
