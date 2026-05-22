(async () => {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const log = (title, obj) => console.log('\n=== ' + title + ' ===\n', JSON.stringify(obj, null, 2));

    try {
    const headers = { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' };
    const res1 = await fetch(`${API}/tasks`, { headers });
    const tasksBefore = res1.ok ? await res1.json() : { error: await res1.text(), ok: res1.ok };
    log('tasks before', Array.isArray(tasksBefore) ? { count: tasksBefore.length, sample: tasksBefore.slice(0,3) } : tasksBefore);

    const newTask = {
      title: 'Sanity test task',
      description: 'Created by sanity_test.js',
      category: 'academic',
      priority: 3,
      deadline: new Date(Date.now() + 24*60*60*1000).toISOString(),
      estimated_hours: 1,
      energy_level: 'medium',
      status: 'todo',
      created_at: new Date().toISOString(),
      user_id: 'demo-user',
      tags: ['sanity'],
      is_recurring: false
    };

    const resPost = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newTask),
    });

    const postBody = await (resPost.ok ? resPost.json() : resPost.text());
    log('post response', { status: resPost.status, body: postBody });

    const createdId = postBody && postBody.id ? postBody.id : null;
    if (createdId) {
      const resGet = await fetch(`${API}/tasks/${createdId}`, { headers });
      const got = resGet.ok ? await resGet.json() : { status: resGet.status, body: await resGet.text() };
      log('get created task', got);
    }
  } catch (err) {
    console.error('Sanity test error:', err);
  }
})();
