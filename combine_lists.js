function parseTable(table) {
  const rows = table.split('|-');//.slice(1); // Split by row and remove the header row
  const result = [];

  rows.forEach(row => {
    const columns = row.split('||').map(col => col.trim());
    const [title, date, placement1v1, placement2v2, partner] = columns;

    result.push({
      title: title.replace(/^\|/, '').trim(),
      date: date.trim(),
      placement1v1: placement1v1.trim(),
      placement2v2: placement2v2.trim(),
      partner: partner.trim()
    });
  });

  return result;
}

const oldTable = `

`
;

const newTable = `

`

const oldList = parseTable(oldTable);


const newList = parseTable(newTable);

function parseDate(dateStr) {
  // Remove ordinal suffixes and handle date ranges
  const cleanedDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/g, '$1');
  const dateParts = cleanedDateStr.split('-');
  const startDateStr = dateParts[0].trim();
  const year = dateStr.match(/\d{4}/)[0]; // Extract the year

  // Append the year to the start date if it's not already included
  const fullStartDateStr = startDateStr.includes(year) ? startDateStr : `${startDateStr}, ${year}`;
  return new Date(Date.parse(fullStartDateStr));
}


function extractTitle(titleWithLink) {
  const titleMatch = titleWithLink.match(/\[https?:\/\/[^\s]+\s([^\]]+)\]/);
  return titleMatch ? titleMatch[1].trim() : titleWithLink.trim();
}

function mergeLists(oldList, newList) {
  const mergedList = [...oldList];

  newList.forEach(newEvent => {
    const newEventTitle = extractTitle(newEvent.title);
    const existingEvent = mergedList.find(event => extractTitle(event.title) === newEventTitle);
    
    if (existingEvent) {
      if (!existingEvent.placement1v1.includes('/') && newEvent.placement1v1.includes('/')) {
        existingEvent.placement1v1 = newEvent.placement1v1;
      }
      if (!existingEvent.placement2v2.includes('/') && newEvent.placement2v2.includes('/')) {
        existingEvent.placement2v2 = newEvent.placement2v2;
      }
    } else {
      mergedList.push(newEvent);
    }
  });

  mergedList.sort((a, b) => parseDate(a.date) - parseDate(b.date));

  return mergedList;
}

function formatList(list) {
  let formattedList = "===''[[Super Smash Bros. Ultimate]]''===\n{|class=\"wikitable\" style=\"text-align:center\"\n!Tournament!!Date!!1v1 placement!!2v2 placement!!Partner\n";
  list.forEach(event => {
    formattedList += `|-\n|${event.title}||${event.date}||${event.placement1v1}||${event.placement2v2}||${event.partner}\n`;
  });
  formattedList += "|}";
  return formattedList;
}

const mergedList = mergeLists(oldList, newList);
const formattedOutput = formatList(mergedList);
console.log(formattedOutput);
