const BASE_URL = '/api'

const PredictionsAPI = {
    getPredictionsByUser: async (userId) => {
        const res = await fetch(`${BASE_URL}/predictions/user/${userId}`)
        if (!res.ok) throw new Error('Failed to fetch predictions')
        return res.json()
    },

    createPrediction: async (prediction) => {
        const res = await fetch(`${BASE_URL}/predictions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prediction)
        })
        if (!res.ok) throw new Error('Failed to create prediction')
        return res.json()
    }
}

export default PredictionsAPI
