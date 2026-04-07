require('dotenv').config();
const axios = require('axios');

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_KEY;
const PAGE_URL = "https://opencorporates.com/companies";

// The site key is a hidden ID OpenCorporates uses for their Captcha
const SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; 

async function testTwoCaptcha() {
    console.log("Starting 2Captcha Solver Test...");

    if (!TWOCAPTCHA_API_KEY) {
        console.log("Error: TWOCAPTCHA_KEY is missing in your .env file.");
        return;
    } else {
        const maskedKey = TWOCAPTCHA_API_KEY.substring(0, 4) + "..." + TWOCAPTCHA_API_KEY.substring(TWOCAPTCHA_API_KEY.length - 4);
        console.log("Loaded API Key: " + maskedKey);
    }

    try {
        console.log("Sending Captcha task to 2Captcha...");
        
        // Use the 2Captcha createTask endpoint
        const taskResponse = await axios.post('https://api.2captcha.com/createTask', {
            clientKey: TWOCAPTCHA_API_KEY,
            task: {
                type: "RecaptchaV2TaskProxyless",
                websiteURL: PAGE_URL,
                websiteKey: SITE_KEY
            }
        });

        if (taskResponse.data.errorId !== 0) {
            console.log("Error from 2Captcha: " + taskResponse.data.errorDescription);
            return;
        }

        const taskId = taskResponse.data.taskId;
        console.log("Got Task ID: " + taskId);

        console.log("Waiting for 2Captcha to finish...");
        let isDone = false;
        
        while (!isDone) {
            await new Promise(r => setTimeout(r, 5000)); 
            
            // Use the 2Captcha getTaskResult endpoint
            const resultResponse = await axios.post('https://api.2captcha.com/getTaskResult', {
                clientKey: TWOCAPTCHA_API_KEY,
                taskId: taskId
            });

            if (resultResponse.data.status === "ready") {
                isDone = true;
                console.log("Captcha solved successfully!");
                console.log("Solution Token: " + resultResponse.data.solution.gRecaptchaResponse);
            } else if (resultResponse.data.status === "processing") {
                console.log("Still processing... waiting 5 more seconds.");
            } else {
                console.log("Unexpected status: " + resultResponse.data.status);
            }
        }

    } catch (error) {
        console.log("Network error!");
        if (error.response && error.response.data) {
            console.log("2Captcha said: " + JSON.stringify(error.response.data, null, 2));
        } else {
            console.log(error.message);
        }
    }
}

testTwoCaptcha();