# RESTful Envelope Budgeting API

## About this Project

[Envelope Budgeting](https://www.moneycrashers.com/envelope-budgeting-system/) is a budgeting strategy in which a person allocates pre-portioned amounts of cash to different budget categories and then stores this cash (either literally or figuratively) in “envelopes” for each category.

For example, suppose that each week you make an envelope for “Gas”, “Groceries”, and “Entertainment” and place some money in each. Then, for that week, you may only spend the money in that envelope on related expenses. Now suppose you place $30 in your Entertainment envelope. You spend $20 on movie tickets for you and your partner and an additional $10 on a digital music subscription. Your envelope is exhausted, so you’ll need to find free entertainment for the rest of the week!

This API works according to similar rules but is intended more for planning than for real-time cash withdrawal. Hence, this API breaks one of the traditional Envelope Budgeting rules— you can add more expenses to an envelope than it has funds. The intent behind bending the rules here is to allow the user to choose which expenses to remove from the envelope after pushing it over its limit. A user can see if the envelope has a negative amount left and then decide which expenses to remove to balance the budget.

### Status

This API is live on Heroku at https://envelopes-api.herokuapp.com/.


### Is this a school assignment?

Yes and no. I submitted a version of this project in December 2018 as a final project for [CS493 - Cloud Application Development](https://ecampus.oregonstate.edu/soc/ecatalog/ecoursedetail.htm?subject=CS&coursenumber=493&termcode=all), an elective in Oregon State University's post-baccalaureate in Computer Science program.

Since then, I've rebuilt the project several times, tweaking the architecture, improving the asynchronous code, and altering a bit of what the interface provides. I've also formalized my written documentation in an OpenAPI Specification using SwaggerHub and ReDoc. Of course, there's still [plenty](#areas-for-future-improvement) I could do in the future to improve the project.

<!----------------------------------------------------------------------------->
## API Entities

In the Envelope Budgeting API, there are three entities: 
* Users
* Envelopes (i.e. budgeting categories)
* Expenses (i.e. money that needs to be spent)

Envelopes don’t always have to have Expenses attached to them and Expenses don’t always have to be in an Envelope; users create envelopes and expenses independent of each other and then decide later which Expenses go with which Envelopes. Expenses may only be assigned to one Envelope at a time, but Envelopes may contain multiple Expenses.

Envelopes and Expenses must be owned by a User. If a User is deleted, his/her Envelopes and Expenses are deleted too.

![A User owns Envelopes and Expenses. Each Expense may be assigned to one Envelope.](https://i.imgur.com/IyTXkDQ.png)

<!----------------------------------------------------------------------------->

## API Endpoints

Complete endpoint documentation is [hosted here](https://envelopes-api.herokuapp.com/) at the project's root URL.

<!----------------------------------------------------------------------------->

## Areas for Future Improvement

* **Implement an Oauth 2.0 flow** - I would love to add a more robust authentication and authorization flow in the future. The use of ID tokens throughout the API has some downsides, but it was a great learning exercise.

* **Add scopes** - Right now, users can view all resources belonging to other users. But in the real world, wouldn't we want to be able to make some (if not all) of our expenses private? This could be accomplished by adding scopes.

* **Provide automated testing** - I have my own Postman tests that I've used to validate this API, but they're not very elegant. I'd love to set aside some time to make an improved automated test suite.

<!----------------------------------------------------------------------------->

## Resources

### Libraries & Tools:
* [Express.js](http://expressjs.com/) - web framework
* [Google Datastore](https://cloud.google.com/datastore/docs/) - NoSQL data storage
* [bcrypt](https://www.npmjs.com/package/bcrypt) - password hashing
* [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - authorization & authentication
* [joi](https://www.npmjs.com/package/joi) - input verification
* [SwaggerHub](https://swagger.io/tools/swaggerhub/) - OpenApi specification
* [ReDoc](https://github.com/Rebilly/ReDoc) - API documentation theme

### Tutorials and Documentation Referenced:
**JSON Web Tokens:**
* [Node js JWT Authentication Tutorial From Scratch](https://appdividend.com/2018/02/07/node-js-jwt-authentication-tutorial-scratch/#Step_2_Configure_theNode_Server)
* [JSON Web Token (JWT) — The right way of implementing, with Node.js](https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e)
* [Securing Node.js RESTful APIs with JSON Web Tokens](https://medium.freecodecamp.org/securing-node-js-restful-apis-with-json-web-tokens-9f811a92bb52)

**Google Datastore:**
* [Cloud Firestore in Datastore mode documentation](https://cloud.google.com/datastore/docs/)
* [How to authenticate Google Cloud Services on Heroku for Node.js App](https://medium.com/@naz_islam/how-to-authenticate-google-cloud-services-on-heroku-for-node-js-app-dda9f4eda798)

### Acknowledgments:
* **Justin Wolford** - *instructor & course designer at Oregon State University* - designed the original assignment this project was based on.
* **Eric Ianni** - *instructor at Oregon State University* - my instructor for Cloud Application Development (CS493).

<!----------------------------------------------------------------------------->

## Author
* **Emily Hamilton** - https://github.com/e-hamilton