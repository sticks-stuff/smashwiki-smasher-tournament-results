require("dotenv").config();
const fs = require("fs");
var moment = require('moment'); 
const { gql, GraphQLClient } = require("graphql-request");

const ENDPOINT = "https://api.start.gg/gql/alpha";
const TOKEN = process.env.START_GG_API_TOKEN;

const graphQLClient = new GraphQLClient(ENDPOINT, {
  headers: {
    authorization: `Bearer ${TOKEN}`,
  },
});

const queryUser = gql`
  query User($userSlug: String!) {
    user(slug: $userSlug) {
      id
      player {
        gamerTag
      }
    }
  }
`;


const queryEntrantsPages = gql`
  query UserEntrants($userId: ID!) {
    user(id: $userId) {
      events(query: {
        page: 0
        perPage: 75
      }){
        pageInfo {
          totalPages
        }
      }
    }
  }
`;

const queryEntrants = gql`
  query UserEntrants($userId: ID!, $page: Int!) {
    user(id: $userId) {
      events(query: {
        page: $page
        perPage: 75
      }){
        nodes {
          slug
          numEntrants
          isOnline
          startAt
          tournament {
            id
            countryCode
            name
            slug
            shortSlug
          }
          videogame {
            displayName
          }
          userEntrant(userId: $userId) {
            standing {
              placement
            }
            team {
              members {
                player {
                  gamerTag
                  id
                }
              }
            }
          }
          teamRosterSize {
            maxPlayers
          }
        }
      }
    }
  }
`;


function getOrdinal(n) {
  let ord = 'th';

  if (n % 10 == 1 && n % 100 != 11)
  {
    ord = 'st';
  }
  else if (n % 10 == 2 && n % 100 != 12)
  {
    ord = 'nd';
  }
  else if (n % 10 == 3 && n % 100 != 13)
  {
    ord = 'rd';
  }

  return n + ord;
}

function uniqBy(a, key) {
  var seen = {};
  return a.filter(function(item) {
      var k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  })
}

var ssb = "Super Smash Bros.";
var melee = "Super Smash Bros. Melee";
var brawl = "Super Smash Bros. Brawl";
var pm = "Project M";
var pplus = "Project+";
var wiiu = "Super Smash Bros. for Wii U";
var threeds = "Super Smash Bros. for Nintendo 3DS";
var ulti = "Super Smash Bros. Ultimate";


var tournamentResultSsb = "";
tournamentResultSsb += "===''[[";
tournamentResultSsb += ssb;
tournamentResultSsb += "]]''===";
tournamentResultSsb += "\n";
tournamentResultSsb += "{|class=\"wikitable\" style=\"text-align:center\"";

var tournamentResultMelee = "";
tournamentResultMelee += "===''[[";
tournamentResultMelee += melee;
tournamentResultMelee += "]]''===";
tournamentResultMelee += "\n";
tournamentResultMelee += "{|class=\"wikitable\" style=\"text-align:center\"";

var tournamentResultBrawl = "";
tournamentResultBrawl += "===''[[";
tournamentResultBrawl += brawl;
tournamentResultBrawl += "]]''===";
tournamentResultBrawl += "\n";
tournamentResultBrawl += "{|class=\"wikitable\" style=\"text-align:center\"";

var tournamentResultPm = "";
tournamentResultPm += "===''[[";
tournamentResultPm += pm;
tournamentResultPm += "]]''===";
tournamentResultPm += "\n";
tournamentResultPm += "{|class=\"wikitable\" style=\"text-align:center\"";

var tournamentResultPplus = "";
tournamentResultPplus += "===''[[";
tournamentResultPplus += pplus;
tournamentResultPplus += "]]''===";
tournamentResultPplus += "\n";
tournamentResultPplus += "{|class=\"wikitable\" style=\"text-align:center\"";

var tournamentResultWiiu = "";
tournamentResultWiiu += "===''[[";
tournamentResultWiiu += wiiu;
tournamentResultWiiu += "]]''===";
tournamentResultWiiu += "\n";
tournamentResultWiiu += "{|class=\"wikitable\" style=\"text-align:center\"";

var tournamentResultThreeds = "";
tournamentResultThreeds += "===''[[";
tournamentResultThreeds += threeds;
tournamentResultThreeds += "]]''===";
tournamentResultThreeds += "\n";
tournamentResultThreeds += "{|class=\"wikitable\" style=\"text-align:center\"";

var tournamentResultsUlti = "";
tournamentResultsUlti += "===''[[";
tournamentResultsUlti += ulti;
tournamentResultsUlti += "]]''===";
tournamentResultsUlti += "\n";
tournamentResultsUlti += "{|class=\"wikitable\" style=\"text-align:center\"";

function escapeSpecialCaseChar(text) {
  text.replace(/[[\]{}*\\^|]/g, '\\$&');
  text.replace("=", "{{=}}");
  return text.replace("|", "&#124;");
}

const getPlayerInfo = async (userSlug) => {
  // console.log(userSlug)
  const dataUser = await graphQLClient.request(queryUser, {userSlug});
  // console.log(dataUser);
  // console.log(dataUser.user.id);



  const dataEntrantsPages = await graphQLClient.request(queryEntrantsPages, {userId: dataUser.user.id});
  let events = new Array;
  for (let i = 0; i < dataEntrantsPages.user.events.pageInfo.totalPages; i++) {
    const dataEntrants = await graphQLClient.request(queryEntrants, {userId: dataUser.user.id, page: i});
    dataEntrants.user.events.nodes.forEach(element => {
      events.push(element);
    });
  }

  events = uniqBy(events, JSON.stringify);
  events.sort((a, b) => a.startAt - b.startAt);

  events.forEach(element => {
    var noSolo = false;
    if(element.teamRosterSize) {
      if(element.teamRosterSize.maxPlayers == 2) {
        for (let i = 0; i < events.length; i++) {
          const solofind = events[i];
          if(!solofind.teamRosterSize && solofind.tournament.id == element.tournament.id) {
            return; //skip this so that we can come back to it for 2v2s
          }
        }
      } else {
        return;
      }
      noSolo = true; //entered a tournament only in doubles
    }
    if(element.slug.includes("squad")) { //no squad strike
      return;
    }
    if(element.slug.includes("crew")) { //no crew battles
      return;
    }
    if(element.slug.includes("reverse")) { //no reverse mains
      return;
    }
    if(element.slug.includes("rock-paper-scissors")) { //wtf
      return;
    }
    if(element.slug.includes("hdr")) { //hdr isnt a different game on start.gg nor should it be listed on smasher pages (https://discord.com/channels/186707873789640705/186708155873492993/1121290628073005066)
      return;
    }

    if(noSolo) {
      console.log("DOUBLES W/O SINGLES: " + element.slug);
    }
    
    var tournamentLine = "";
    tournamentLine += "\n";
    tournamentLine += "|[https://start.gg/";
    if(element.tournament.shortSlug) tournamentLine += element.tournament.shortSlug
    else tournamentLine += element.tournament.slug;
    tournamentLine += " ";
    tournamentLine += escapeSpecialCaseChar(element.tournament.name);
    tournamentLine += "]";
    if(element.isOnline) {
      tournamentLine += " {{OnlineIcon}}";
    }
    tournamentLine += "||";
    tournamentLine += moment.unix(element.startAt).format('MMMM Do, YYYY');
    tournamentLine += "||";

    if(!noSolo) {
      try {
        tournamentLine += getOrdinal(element.userEntrant.standing.placement);
      } catch (err) {
        console.log("Error in placement " + console.dir(element.userEntrant));
        console.log(console.log(element.slug));
      }
      tournamentLine += " / ";
      tournamentLine += element.numEntrants;
    } else {
      tournamentLine += "&mdash;";
    }
    tournamentLine += "||";

    var twovtwo = false;
    for (let i = 0; i < events.length; i++) {
      const teamfind = events[i];
      if(teamfind.teamRosterSize) {
        if(teamfind.teamRosterSize.maxPlayers == 2 && teamfind.tournament.id == element.tournament.id) {
          teamfind.userEntrant.team.members.forEach(member => {
            if((member.player.id != dataUser.user.id) && (member.player.gamerTag != dataUser.user.player.gamerTag) && (teamfind.videogame.displayName == element.videogame.displayName)) {
              tournamentLine += getOrdinal(teamfind.userEntrant.standing.placement);
              tournamentLine += " / ";
              tournamentLine += teamfind.numEntrants;
              tournamentLine += "||";
              tournamentLine += "{{Sm|";
              tournamentLine += escapeSpecialCaseChar(member.player.gamerTag);
              tournamentLine += "}}";
              twovtwo = true;
              return;
            }
          })
        }
      }
    }
    if(twovtwo == false) {
      tournamentLine += "&mdash;||&mdash";
    }
    tournamentLine += ";";
    tournamentLine += "\n|-";
    switch(element.videogame.displayName) {
      case "Super Smash Bros.":
        tournamentResultSsb += tournamentLine;
        break;
      case "Melee":
        tournamentResultMelee += tournamentLine;
        break;
      case "Brawl":
        tournamentResultBrawl += tournamentLine;
        break;
      case "PM":
        tournamentResultPm += tournamentLine;
        break;
      case "Project+":
        tournamentResultPplus += tournamentLine;
        break;
      case "Super Smash Bros. for Nintendo 3DS":
        tournamentResultThreeds += tournamentLine;
        break;
      case "Super Smash Bros. for Wii U":
        tournamentResultWiiu += tournamentLine;
        break;
      case "Ultimate":
        tournamentResultsUlti += tournamentLine;
        break;
    
      default:
        console.log("UNKNOWN GAME: " + element.videogame.displayName + " " + element.slug)
        break;
    }
  });
  tournamentResultSsb += "\n|}\n";
  tournamentResultMelee += "\n|}\n";
  tournamentResultBrawl += "\n|}\n";
  tournamentResultPm += "\n|}\n";
  tournamentResultPplus += "\n|}\n";
  tournamentResultWiiu += "\n|}\n";
  tournamentResultThreeds += "\n|}\n";
  tournamentResultsUlti += "\n|}\n";
  console.log(tournamentResultSsb);
  console.log(tournamentResultMelee);
  console.log(tournamentResultBrawl);
  console.log(tournamentResultPm);
  console.log(tournamentResultPplus);
  console.log(tournamentResultWiiu);
  console.log(tournamentResultThreeds);
  console.log(tournamentResultsUlti);
};


const userSlug = process.argv[2];
getPlayerInfo(userSlug);
