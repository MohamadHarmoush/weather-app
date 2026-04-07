async function findCityLocation(name) {
    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=1&format=json`;
    return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        console.log(data)
        if (data.results === undefined || data.results.length == 0) throw Error('Error no results found!');
        const city = data.results[0];
        const location = {
            latitude: city.latitude,
            longitude: city.longitude, 
        };
        return location;
    })
    .catch(erorr => {
        console.error(erorr);
    })
}

const input = prompt();
findCityLocation('Berlin').then(console.log);
