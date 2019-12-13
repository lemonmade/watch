export default function watchApi() {
  return {
    statusCode: 200,
    body: JSON.stringify({hello: 'world'}),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };
}
