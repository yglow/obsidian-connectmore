export function parseVCF(content: string): any[] {
    const contacts = [];
    const vcardRegex = /BEGIN:VCARD[\s\S]*?END:VCARD/g;
    let match;

    while ((match = vcardRegex.exec(content)) !== null) {
        const vcard = match[0];
        const name = vcard.match(/FN:(.*)/)?.[1] || 'Unknown';
        const phone = vcard.match(/TEL.*:(.*)/)?.[1] || '';
        const email = vcard.match(/EMAIL.*:(.*)/)?.[1] || '';
        const birthday = vcard.match(/BDAY:(.*)/)?.[1] || '';

        contacts.push({ name, phone, email, birthday });
    }

    return contacts;
}