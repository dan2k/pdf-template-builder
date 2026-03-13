async function run() {
    try {
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'NEW_PASSWORD' })
        });

        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Got token');

        const tRes = await fetch('http://localhost:3000/templates', { headers: { Authorization: `Bearer ${token}` } });
        const tData = await tRes.json();
        if (!tData || tData.length === 0) { console.log('No templates found to test'); return; }
        const templateId = tData[0].id;
        console.log('Testing template update on ID:', templateId);

        const res = await fetch(`http://localhost:3000/templates/${templateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                category: 'test1',
                tags: ['invoice'],
                visibility: 'private',
                allowCopy: false
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            console.error('Update failed. Status:', res.status);
            console.error('Response body:', JSON.stringify(errData, null, 2));
        } else {
            const data = await res.json();
            console.log('Update success:', data.id);
        }
    } catch (e) { console.error('Error:', e.message); }
}

run();
