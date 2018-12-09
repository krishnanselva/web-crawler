Problem description : Refer ./Web_Crawler_Requirement_Spec.MD 

Steps to run Web Crawler:

1. Clone the project:

    `git clone https://github.com/krishnanselva/web-crawler.git`

2. Install dependencies:

   `npm install`

3. Run unit test:

   `npm run test`   

4. Start the app:
   
   `node app.js https://abcd.com ../sitemap.txt`

5. Check the logs for below output:

    `Error requesting https://abcd.com/any/some.`

6. App stops after couple of minutes on completion of one cycle of web crawling   
  `takes about couple of minutes to list 8343 urls`

7. Sitemap generation:

    `App should have generated ../sitemap.txt file under the parent folder of web-clawler folder`

8. Assumptions:
    ```Unreachable url are logged in console.
    Concurrent requests are limited to 5 (maxConcurrentReq)
    Hash is not trimmed in the url.
    Query parameters are not removed.
    Unit testing/TDD done to minimum - just to demonstrate the skill.
    Static resource url are not segregated separately.
    Background images are not extracted.
    Url in the argument is expected to have the protocol (http or https)


     set DEBUG=express:* & node web-scraper.js