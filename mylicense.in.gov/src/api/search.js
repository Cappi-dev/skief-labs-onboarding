import * as cheerio from 'cheerio';
import client from './client.js';

function getTokens($) {
    return {
        viewState: $('#__VIEWSTATE').val(),
        generator: $('#__VIEWSTATEGENERATOR').val(),
        validation: $('#__EVENTVALIDATION').val()
    };
}

export async function performInitialSearch(lastName = "") {
    const res1 = await client.get('https://mylicense.in.gov/EVerification/Search.aspx?facility=N');
    let $ = cheerio.load(res1.data);
    let tokens = getTokens($);

    const handshake = new URLSearchParams();
    handshake.append('__EVENTTARGET', 't_web_lookup__profession_name');
    handshake.append('__VIEWSTATE', tokens.viewState);
    handshake.append('__VIEWSTATEGENERATOR', tokens.generator);
    handshake.append('__EVENTVALIDATION', tokens.validation);
    handshake.append('t_web_lookup__profession_name', 'Veterinary Board');
    const res2 = await client.post('https://mylicense.in.gov/EVerification/Search.aspx?facility=N', handshake.toString());
    
    $ = cheerio.load(res2.data);
    tokens = getTokens($);

    const search = new URLSearchParams();
    search.append('__VIEWSTATE', tokens.viewState);
    search.append('__VIEWSTATEGENERATOR', tokens.generator);
    search.append('__EVENTVALIDATION', tokens.validation);
    search.append('t_web_lookup__profession_name', 'Veterinary Board');
    search.append('t_web_lookup__last_name', lastName); 
    search.append('sch_button', 'Search');
    
    const res3 = await client.post('https://mylicense.in.gov/EVerification/Search.aspx?facility=N', search.toString());
    return res3.data;
}

export async function goToPage(html, pageNumber) {
    const $ = cheerio.load(html);
    const tokens = getTokens($);
    const params = new URLSearchParams();

    params.append('__VIEWSTATE', tokens.viewState);
    params.append('__VIEWSTATEGENERATOR', tokens.generator);
    params.append('__EVENTVALIDATION', tokens.validation);

    let ctlIndex = pageNumber - 1; 
    params.append('__EVENTTARGET', `datagrid_results$_ctl44$_ctl${ctlIndex}`);
    params.append('__EVENTARGUMENT', '');

    const response = await client.post('https://mylicense.in.gov/EVerification/SearchResults.aspx', params.toString());
    return response.data;
}