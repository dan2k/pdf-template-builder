async function apiCall(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`http://localhost:3000${path}`, options);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function run() {
    try {
        console.log('1. Login as Admin');
        let res;
        try {
            res = await apiCall('POST', '/auth/login', { username: 'admin', password: 'admin123' });
        } catch (e) {
            if (e.message.includes('401')) {
                res = await apiCall('POST', '/auth/login', { username: 'admin', password: 'admin' });
            } else throw e;
        }

        let token = res.access_token;

        if (res.user.isFirstLogin) {
            console.log('Force changing admin password...');
            res = await apiCall('POST', '/auth/change-password', { oldPassword: 'admin', newPassword: 'admin123' }, token);
            token = res.access_token;
        }

        console.log('2. Create Department');
        const deptRes = await apiCall('POST', '/departments', { name: `Test Dept ${Date.now()}` }, token);
        const deptId = deptRes.id;
        console.log('Department created:', deptId);

        console.log('3. Create User');
        const userRes = await apiCall('POST', '/users', {
            username: `testuser_${Date.now()}`,
            password: 'password123',
            role: 'user',
            departmentId: deptId
        }, token);
        const username = userRes.username;
        console.log('User created:', username);

        console.log('4. Login as User');
        const userLogin = await apiCall('POST', '/auth/login', { username, password: 'password123' });
        let userToken = userLogin.access_token;

        console.log('Force changing user password...');
        const userChangeRes = await apiCall('POST', '/auth/change-password', { oldPassword: 'password123', newPassword: 'newpass123' }, userToken);
        userToken = userChangeRes.access_token;

        console.log('5. Create Category');
        const catRes = await apiCall('POST', '/categories', { name: 'Root Category', color: '#1a56db' }, userToken);
        const catId = catRes.id;
        console.log('Category created:', catRes.name);

        console.log('6. Create Subcategory');
        const subCatRes = await apiCall('POST', '/categories', { name: 'Subcategory', color: '#10b981', parentId: catId }, userToken);
        console.log('Subcategory created:', subCatRes.name);

        console.log('7. Create Template');
        const tplRes = await apiCall('POST', '/templates', { name: 'Test Template' }, userToken);
        const tplId = tplRes.id;
        console.log('Template created:', tplId);

        console.log('8. Update Template Settings (Visibility & Category)');
        await apiCall('PUT', `/templates/${tplId}`, {
            category: 'Subcategory',
            visibility: 'public',
            allowCopy: true
        }, userToken);
        console.log('Template settings updated (No 500 error!)');

        console.log('9. Generate API Key');
        const keyRes = await apiCall('POST', `/api-keys`, { templateId: tplId, label: 'Prod Key' }, userToken);
        console.log('API Key generated successfully. Prefix:', keyRes.prefix);

        console.log('--- ALL TESTS PASSED ---');
    } catch (err) {
        console.error('TEST FAILED:', err.message);
        process.exit(1);
    }
}

run();
