export default robot => {
  // $ curl http://localhost:8080/endpoint_test
  // > hubot httpd test
  robot.router.get('/endpoint_test', (req, res) =>
    res.end('hubot httpd test')
  );
};
