/// SERVER requirements
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

/// APP requiements
const { dialogflow, SimpleResponse, BasicCard, Image, Table, Carousel } = require('actions-on-google');
const axios = require('axios');

/// Variables
const PORT = process.env.PORT;

/// App Initialisation
const app = dialogflow({
    debug: false,
})

app.intent('get-weather-info', async (conv) => {

    let solDay, season, minAT, maxAT;

    await axios.get(`https://api.nasa.gov/insight_weather/?api_key=${process.env.NASA_API_KEY}&feedtype=json&ver=1.0`)
        .then((response) => {
            solDay = response.data.sol_keys.sort((a, b) => b - a)[0]
            season = response.data[solDay].Season;
            minAT = response.data[solDay].AT.mn;
            maxAT = response.data[solDay].AT.mx;

        })
        .catch((err) => {
            let error = new Error(err)
            throw error
        })

    conv.ask(new SimpleResponse({
        speech: 'Sol Day ' + solDay + '. ' +
            'Its ' + season + ' in Mars with maximum air temperature of ' + maxAT + ' degree celsius and minimum of ' + minAT + ' degree celsius',
        text: 'Sol Day: ' + solDay + '\n' + 'Season: ' + season + '\n' + 'Maximum Temperature: ' + maxAT + '\n' + 'Minimum Temperatue: ' + minAT + '\n'
    }))

})

app.intent('get-astronomy-picture', async (conv) => {

    let title, text, image

    if (!conv.screen) {
        conv.ask(new SimpleResponse({
            speech: "Sorry, your device doesn't support, try this on a screen device",
            text: "Sorry, your device doesn't support, try this on a screen device"
        }))
        return
    }

    await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`)
        .then((response) => {
            text = response.data.explanation;
            title = response.data.title;
            image = new Image({
                url: response.data.hdurl,
                alt: 'Image of the day'
            })
        })
        .catch((err) => {
            let error = new Error(err)
            throw error
        })

        conv.ask(new SimpleResponse({
            speech:'Here is an image with some pinch of general knowledge'
        }))
        conv.ask(new BasicCard({
            image: image,
            title: title,
            text: text
        }))
        
})

app.intent('closing-intent', (conv) => {
    conv.close('See you later!')
})

express().use(bodyParser.json(), app).listen(PORT, () => console.log(`Webhook Listening on Port ${PORT}`));
