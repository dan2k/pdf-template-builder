const axios = require('axios');

async function run() {
    try {
        const loginRes = await axios.post('http://localhost:3000/auth/login', {
            username: 'admin',
            password: 'NEW_PASSWORD'
        });

        const token = loginRes.data.access_token;
        console.log('Got token');

        // Attempt to update template 1 (assuming it exists, we can use any template id in DB)
        const tRes = await axios.get('http://localhost:3000/templates', { headers: { Authorization: `Bearer ${token}` } });
        if (tRes.data.length === 0) { console.log('No templates found to test'); return; }
        const templateId = tRes.data[0].id;
        console.log('Testing template update on ID:', templateId);

        try {
            const res = await axios.put(`http://localhost:3000/templates/${templateId}`, {
                category: 'test1',
                tags: ['invoice'],
                visibility: 'private',
                allowCopy: false
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Update success:', res.data.id);
        } catch (err) {
            console.error('Update failed. Status:', err.response?.status);
            console.error('Response body:', JSON.stringify(err.response?.data, null, 2));
        }
    } catch (e) { console.error('Error:', e.message); }
}

run();
