import chalk from 'chalk';
import fs from 'fs';


let duration = 'week';
let limit = 10;
let language = '';

const args = process.argv.slice(2);

for (let i=0; i < args.length; i++){
    if (args[i]=== '--duration' && args[i+1]){
        duration =  args[i+1] as string;
        i++;
    } else if (args[i]=== '--limit' && args[i+1]){
        limit = parseInt(args[i+1] as string, 10);
        i++;
    } else if (args[i]=== '--language' && args[i+1]){
        language = args[i+1] as string;
        language = language.toLowerCase();
        i++;
        
    }
}


function getStartDate(duration: string): string{
    const date = new Date();

    switch(duration.toLowerCase()){
        case 'day':
            date.setDate(date.getDate()-1);
            break;
        case 'week':
            date.setDate(date.getDate()-7);
            break;
        case 'month':
            date.setMonth(date.getMonth()-1);
            break;
        case 'year':
            date.setFullYear(date.getFullYear()-1);
            break;
        default:
            console.log("Invalid duration. Accepted values are day, week, month or year. Using 'week' as default.");
            date.setDate(date.getDate()-7);
    }

    return date.toISOString().split('T')[0] as string;

}

function printRepoDetails(reposList: any, index: number, limit: number){

    
        for (index=0; index<limit && index<reposList.repos.length; index=index+1){
    console.log("|",chalk.green(`${index+1 }.${reposList.repos[index].full_name} (${reposList.repos[index].stargazers_count})`));
    console.log(             `|   URL: ${reposList.repos[index].html_url}`);
    console.log(             `|   Language: ${reposList.repos[index].language || 'N/A'}`);
    console.log(             `|   Description: ${reposList.repos[index].description || 'No description provided.'}`);
    console.log('-'.repeat(150));
}
}


function compareQuery(duration: string, language: string, cachedQuery: string): boolean{
    const currentQuery = `language:${language}+${duration}`;
    return currentQuery === cachedQuery;
}

async function fetchTrendingRepos(){
    
    console.log(`Fetching top ${limit} trending repos from the past ${duration}..... in the ${language} language....\n`);

        const startDate = getStartDate(duration);
    
    

        const url = `https://api.github.com/search/repositories?q=language:${language}+created:>${startDate}&sort=stars&order=desc`;

        try {

            const response = await fetch(url,{
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Trending-repos-cli'
                }
        });

            if (!response.ok){
                throw new Error(`GitHup API returned: ${response.status}`);
            }

        const data = await response.json();

        let reposArray = data.items ? data.items : data;

        if (!Array.isArray(reposArray)) {

            
            if (reposArray.message) {
                 throw new Error(`GitHub API Error: ${reposArray.message}`);
            }
            console.error("Unexpected API response structure:", data);
            return;
        }


       
        let reposList = {timestamp:Date.now(),
            query: `language:${language}+${duration}`,
            repos: reposArray.slice(0, limit).map((repo: any) => ({
                full_name: repo.full_name,
                html_url: repo.html_url,
                description: repo.description,
                stargazers_count: repo.stargazers_count,
                language: repo.language
            }))
        };

        if (reposList.repos.length === 0) {
            console.log("No repositories found.");
            return;
        }
        
        else {
            return reposList;
            
            
        }
    

    }catch (error){
        console.log("Error fetching the repos", (error as Error).message);
    }
    

    
}

async function updateCache(newRepos: any) {
    let masterCache = JSON.parse(fs.readFileSync('./trendingRepos.json', 'utf-8'));
    masterCache[`language:${language}+${duration}`] = newRepos;
    fs.writeFileSync('./trendingRepos.json', JSON.stringify(masterCache, null, 2));
}

async function startCli(){

    if(fs.existsSync('./trendingRepos.json')){

        
        const cachedRepos = JSON.parse(fs.readFileSync('./trendingRepos.json', 'utf-8'));
        const currentQuery = `language:${language}+${duration}`;
        const currentTime = Date.now();
        const cachedQuery = cachedRepos[currentQuery]?.query || '';
        const fiveMinutes = 5 * 60 * 1000;


    let repos;
    

    if (cachedRepos[currentQuery] && compareQuery(duration, language, cachedQuery)) {
        const cacheTime = cachedRepos[currentQuery].timestamp || 0;
        if (currentTime - cacheTime < fiveMinutes) {
            console.log("Using cached data....\n");
            repos = cachedRepos[currentQuery];
            printRepoDetails(repos, 0, limit);

     } else {
            console.log("Cache expired or new query encountered. Fetching new data...\n");
            const data = await fetchTrendingRepos();
        
            printRepoDetails(data, 0, limit);

            await updateCache(data);

        }
            
        
     

    
    }else if (!compareQuery(duration, language, cachedQuery)){
        console.log("Updating cache with new query results....\n");
        const data = await fetchTrendingRepos();
        printRepoDetails(data, 0, limit);
        await updateCache(data);
        return;
        }
        //else {console.log('chutiya ho tum');}
        }
    


else{
    const newData = await fetchTrendingRepos();
    const initialCache = { [`language:${language}+${duration}`]: newData };
    fs.writeFileSync('./trendingRepos.json', JSON.stringify(initialCache, null, 2));
    printRepoDetails(newData, 0, limit);
    return;
}
return;
}



startCli();








