const synthetics = require('synthentics')

const canary = async function () {
    await synthetics.executeHttpStep(
        "Verify API returns succesful response",
        process.env.API_ENDPOINT
    )
}

exports.handler = async() => {
    return await canary();
}