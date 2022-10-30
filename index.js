require('dotenv').config()
const axios = require('axios')
const cron = require('node-cron')
const Discord = require('discord.js');
const { schedule } = require('node-cron');

const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Discord.Collection();

client.login(process.env.BOT_TOKEN)

const CHANNEL_ID = "1036019427478622279" // programming channel 

let scheduledRequests = {}

// function listScheduledRequests -> returns all of the scheduled requests with identification numbers (indexes)
// function removeScheduledRequest -> delete scheduled request by identification number (index)

// Listen for commands
client.on(Discord.Events.InteractionCreate, async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "request") {

        /*
        CommandInteractionOptionResolver {
        _group: null,
        _subcommand: null,
        _hoistedOptions: [
            { name: 'url', type: 3, value: 'facebook.com' },
            { name: 'type', type: 3, value: 'get' },
            { name: 'status', type: 4, value: 200 }
        ]
        */

        try {

            url = interaction.options["_hoistedOptions"][0]["value"]
            type = interaction.options["_hoistedOptions"][1]["value"]

            interaction.reply(await request(url, type, true))
        }

        catch (error) {
            // await
            interaction.reply({content: `Request failed with the following exception: ${error}`})
        }

    }

    if (interaction.commandName === "schedule"){
        try {

            interval = interaction.options["_hoistedOptions"][0]["value"]
            url = interaction.options["_hoistedOptions"][1]["value"]
            type = interaction.options["_hoistedOptions"][2]["value"]
            status = interaction.options["_hoistedOptions"][3]["value"]

            scheduleRequest(interval, url, type, status)
            interaction.reply("Scheduled!")
        } catch (error) {
            interaction.reply(error)
        }
    }
})

function signifyFailure(requestType, url){
    client.channels.cache.get(CHANNEL_ID).send(`⚠️ ${requestType.toUpperCase()} request to ${url} FAILED! ⚠️`)
}

function scheduleRequest(interval, url, requestType, expectedStatusCode) {
    console.log("A job has been scheduled!")

    const job = cron.schedule(interval, function() {
        console.log("SCHEDULED JOB IS RUNNING")
        if(request(url, requestType) !== expectedStatusCode){
            console.log("A scheduled request failed!")
            signifyFailure(requestType, url)
            console.log(cron.getTasks())
        }
    })

    // job.start()

    scheduledRequests[job.options.name] = {"cronInterval": interval, "url": url, "requestType": requestType, "expectedStatus": expectedStatusCode}
}

// Make a HTTP request
async function request(url, requestType, isCommand) {
    const res = await axios({
        method: requestType,
        url: url,
    })

    if(isCommand){
        return `${requestType} request to ${url} exited with code ${res.status}`
    }
    
    return res.status
}
