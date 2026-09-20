/* =========================================
   GeoNexus
   Version 2 — Country Explorer
   ========================================= */

const width = 1000;
const height = 520;

const svg = d3
    .select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

const projection = d3
    .geoNaturalEarth1()
    .scale(170)
    .translate([
        width / 2,
        height / 2
    ]);

const path = d3
    .geoPath()
    .projection(projection);

const mapGroup = svg.append("g");

const mapURL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

let countriesData = [];


/* =========================================
   LOAD MAP
   ========================================= */

fetch(mapURL)

    .then(response => {

        if (!response.ok) {
            throw new Error("Unable to load map data.");
        }

        return response.json();

    })

    .then(data => {

        const countries =
            topojson.feature(
                data,
                data.objects.countries
            );

        countriesData = countries.features;

        const loading =
            document.querySelector(".loading");

        if (loading) {
            loading.remove();
        }


        /* DRAW COUNTRIES */

        mapGroup
            .selectAll(".country")
            .data(countriesData)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)

            .on("click", function(event, d) {

                selectCountry(d);

            })

            .append("title")

            .text(d =>
                d.properties.name ||
                "Unknown Country"
            );


        console.log(
            "GeoNexus map loaded successfully."
        );

    })

    .catch(error => {

        console.error(error);

        document.getElementById("map").innerHTML = `

            <div class="loading">

                <h3>Map failed to load</h3>

                <p>${error.message}</p>

            </div>

        `;

    });


/* =========================================
   SELECT COUNTRY
   ========================================= */

function selectCountry(country) {

    const countryName =
        country.properties.name ||
        "Unknown Country";


    /* Remove previous selection */

    mapGroup
        .selectAll(".country")
        .classed("selected-country", false);


    /* Highlight selected country */

    mapGroup
        .selectAll(".country")
        .filter(d => d === country)
        .classed("selected-country", true);


    /* Show information */

    showCountryInfo(countryName);

}


/* =========================================
   COUNTRY INFORMATION
   ========================================= */

function showCountryInfo(countryName) {

    const countryInfo =
        document.getElementById(
            "country-info"
        );


    countryInfo.innerHTML = `

        <div class="country-header">

            <span class="country-icon">
                🌍
            </span>

            <div>

                <h2>
                    ${countryName}
                </h2>

                <p>
                    Country selected
                </p>

            </div>

        </div>


        <div class="country-details">

            <div class="info-card">

                <span>🌎</span>

                <strong>
                    Continent
                </strong>

                <p>
                    Information coming soon
                </p>

            </div>


            <div class="info-card">

                <span>🏛️</span>

                <strong>
                    Capital
                </strong>

                <p>
                    Information coming soon
                </p>

            </div>


            <div class="info-card">

                <span>👥</span>

                <strong>
                    Population
                </strong>

                <p>
                    Information coming soon
                </p>

            </div>


            <div class="info-card">

                <span>📐</span>

                <strong>
                    Area
                </strong>

                <p>
                    Information coming soon
                </p>

            </div>

        </div>


        <button
            class="explore-button"
            onclick="exploreCountry('${countryName}')"
        >
            Explore ${countryName} →
        </button>

    `;

}


/* =========================================
   SEARCH
   ========================================= */

function searchCountry() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const searchTerm =
        input.value
            .trim()
            .toLowerCase();


    if (searchTerm === "") {

        alert(
            "Please enter a country name."
        );

        return;

    }


    const foundCountry =
        countriesData.find(country => {

            const name =
                country.properties.name || "";

            return name
                .toLowerCase()
                .includes(searchTerm);

        });


    if (!foundCountry) {

        alert(
            "Country not found on the map."
        );

        return;

    }


    selectCountry(foundCountry);


    /* Scroll to information */

    document
        .getElementById("country-info")
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

}


/* =========================================
   EXPLORE COUNTRY
   ========================================= */

function exploreCountry(countryName) {

    alert(
        "State and province exploration for " +
        countryName +
        " will be added next."
    );

}
