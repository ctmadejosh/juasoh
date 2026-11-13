export const profile = Object.freeze({
  name: "Joshua Asoh",
  role: "Platform Engineer",
  company: "The Hartford",
  website: "https://juasoh.com",
  resume: "https://juasoh.com/Josh_Asoh_Resume_020926.pdf",
  linkedin: "https://www.linkedin.com/in/joshua-asoh",
  github: "https://github.com/ctmadejosh",
  email: "Joshua.asoh@my.ccsu.edu",
  phone: "203-613-0475",
});

export function createVCard(person = profile) {
  const phone = person.phone.replace(/[^\d+]/g, "");
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${person.name}`,
    `TITLE:${person.role}`,
    `ORG:${person.company}`,
    `TEL;TYPE=WORK,VOICE:${phone}`,
    `EMAIL;TYPE=WORK:${person.email}`,
    `URL:${person.website}`,
    "END:VCARD",
    "",
  ].join("\r\n");
}
