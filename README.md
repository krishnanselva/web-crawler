Problem description : Refer ./Web_Crawler_Requirement_Spec.MD 

Steps to run web crawler:

1. Clone the project:

    `git clone https://github.com/krishnanselva/web-crawler.git`

2. Install dependencies:

   `npm install`

3. Start the app:
   
   `node .\routes\web-crawler-rxjs.js https://wiprodigital.com`

4. Check the logs for below output:

    `Error requesting https://wiprodigital.com/people/jayraj-nair.`

5. App stops after couple of minutes on completion of one cycle of web crawling   
  `takes about couple of minutes to list 8343 urls`

6. Sitemap generation:

    `App should have generated ../sitemap.txt file under the parent folder of web-clawler folder`

7. Assumptions:
    ```Unreachable url are logged in console.
    Hash is not trimmed in the url.
    Query parameters are not removed.
    Unit testing/TDD was not done due to limited time and experimental nature of the task.
    Static resource url are not segregated.