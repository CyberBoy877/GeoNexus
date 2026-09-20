function searchCountry() {

    const input = document.getElementById("searchInput");
    const country = input.value.trim();

    if (country === "") {
        alert("Please enter a country name.");
        return;
    }

    alert("Searching for: " + country);
}
