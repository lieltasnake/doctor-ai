const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://doctor-ai-04d3.onrender.com/signup', {
      name: 'Test',
      email: 'test3@test.com',
      password: 'Password123!'
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
test();
