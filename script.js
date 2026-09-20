const width = 1200;
const height = 520;

let countriesData = [];

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


// -----------------------------
// LOAD COUNTRY DATA
// -----------------------------

fetch("data/countries.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Could not load countries.json");
        }

        return response.json();
    })
    .then(data => {
        countriesData = data;
        console.log("Country data loaded:", countriesData);
        loadWorldMap();
    })
    .catch(error => {
        console.error(error);

        document.getElementById("map").innerHTML = `
            <div class="loading">
                Failed to load country data.
            </div>
        `;
    });


// -----------------------------
// LOAD WORLD MAP
// -----------------------------

function loadWorldMap() {

    fetch(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    )
        .then(response => response.json())
        .then(world => {

            const countries = topojson.feature(
                world,
                world.objects.countries
            ).features;

            mapGroup
                .selectAll(".country")
                .data(countries)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", path)
                .on("click", function(event, d) {

                    const countryName =
                        d.properties.name;

                    selectCountry(countryName);
                });

            document.querySelector(".loading")?.remove();

            console.log(
                "World map loaded:",
                countries.length,
                "countries"
            );
        })
        .catch(error => {

            console.error(error);

            document.getElementById("map").innerHTML = `
                <div class="loading">
                    Failed to load world map.
                </div>
            `;
        });
}


// -----------------------------
// SELECT COUNTRY
// -----------------------------

function selectCountry(countryName) {

    d3.selectAll(".country")
        .classed("selected-country", false);

    d3.selectAll(".country")
        .filter(function(d) {
            return d.properties.name === countryName;
        })
        .classed("selected-country", true);

    showCountryInfo(countryName);
}


// -----------------------------
// SHOW COUNTRY INFORMATION
// -----------------------------

function showCountryInfo(countryName) {

    const country = countriesData.find(
        item =>
            item.name.toLowerCase() ===
            countryName.toLowerCase()
    );

    if (!country) {

        countryInfo.innerHTML = `
            <div class="country-header">
                <div class="country-icon">🌍</div>

                <div>
                    <h2>${countryName}</h2>
                    <p>Country information is being added.</p>
                </div>
            </div>

            <p>
                Detailed information for this country
                is coming soon.
            </p>
        `;

        return;
    }

    countryInfo.innerHTML = `

        <div class="country-header">

            <div class="country-icon">
                🌍
            </div>

            <div>
                <h2>${country.name}</h2>
                <p>Explore ${country.name}</p>
            </div>

        </div>


        <div class="country-details">

            <div class="info-card">
                <span>🌎</span>
                <strong>Continent</strong>
                <p>${country.continent}</p>
            </div>


            <div class="info-card">
                <span>🏛️</span>
                <strong>Capital</strong>
                <p>${country.capital}</p>
            </div>


            <div class="info-card">
                <span>👥</span>
                <strong>Population</strong>
                <p>${country.population}</p>
            </div>


            <div class="info-card">
                <span>📐</span>
                <strong>Area</strong>
                <p>${country.area}</p>
            </div>

        </div>


        <div class="country-details">

            <div class="info-card">
                <span>💰</span>
                <strong>Currency</strong>
                <p>${country.currency}</p>
            </div>


            <div class="info-card">
                <span>🗣️</span>
                <strong>Languages</strong>
                <p>${country.languages}</p>
            </div>

        </div>


        <button
            class="explore-button"
            onclick="exploreCountry('${country.name}')"
        >
            Explore ${country.name}
        </button>
    `;
}


// -----------------------------
// SEARCH COUNTRY
// -----------------------------

function searchCountry() {

    const input =
        document
            .getElementById("searchInput")
            .value
            .trim()
            .toLowerCase();

    if (!input) {
        alert("Please enter a country name.");
        return;
    }

    const country = countriesData.find(
        item =>
            item.name
                .toLowerCase()
                .includes(input)
    );

    if (!country) {

        alert(
            "Country not found. Try another name."
        );

        return;
    }

    selectCountry(country.name);

    highlightCountryOnMap(country.name);
}


// -----------------------------
// HIGHLIGHT COUNTRY
// -----------------------------

function highlightCountryOnMap(countryName) {

    d3.selectAll(".country")
        .classed("selected-country", false);

    const matchingCountry =
        d3.selectAll(".country")
            .filter(function(d) {

                return (
                    d.properties.name
                        .toLowerCase() ===
                    countryName.toLowerCase()
                );
            });

    matchingCountry
        .classed("selected-country", true);

    if (!matchingCountry.empty()) {

        const node =
            matchingCountry.node();

        node.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


// -----------------------------
// EXPLORE COUNTRY
// -----------------------------

function exploreCountry(countryName) {

    alert(
        `${countryName} exploration will be added in the next version!`
    );
}
