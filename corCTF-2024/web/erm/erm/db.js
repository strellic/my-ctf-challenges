const { Sequelize, DataTypes, Op } = require('sequelize');
const slugify = require('slugify');
const { rword } = require('rword');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'erm.db',
    logging: false
});  

const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    }
});

const Member = sequelize.define('Member', {
    username: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    secret: {
        type: DataTypes.STRING,
    },
    kicked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
});

const Writeup = sequelize.define('Writeup', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
    }
});

Category.belongsToMany(Member, { through: 'MemberCategory' });
Member.belongsToMany(Category, { through: 'MemberCategory' });
Member.hasMany(Writeup);
Writeup.belongsTo(Member);

sequelize.sync().then(async () => {
    const writeupCount = await Writeup.count();
    if (writeupCount !== 0) return;
    console.log("seeding db with default data...");

    const categories = ["web", "pwn", "rev", "misc", "crypto", "forensics"];
    const members = [
        { username: "FizzBuzz101", categories: ["pwn", "rev"] },
        { username: "strellic", categories: ["web", "misc"] },
        { username: "EhhThing", categories: ["web", "misc"] },
        { username: "drakon", categories: ["web", "misc"], },
        { username: "ginkoid", categories: ["web", "misc"], },
        { username: "jazzpizazz", categories: ["web", "misc"], },
        { username: "BrownieInMotion", categories: ["web", "rev"] },
        { username: "clubby", categories: ["pwn", "rev"] },
        { username: "pepsipu", categories: ["pwn", "crypto"] },
        { username: "chop0", categories: ["pwn"] },
        { username: "ryaagard", categories: ["pwn"] },
        { username: "day", categories: ["pwn", "crypto"] },
        { username: "willwam845", categories: ["crypto"] },
        { username: "quintec", categories: ["crypto", "misc"] },
        { username: "anematode", categories: ["rev"] },
        { username: "0x5a", categories: ["pwn"] },
        { username: "emh", categories: ["crypto"] },
        { username: "jammy", categories: ["misc", "forensics"] },
        { username: "pot", categories: ["crypto"] },
        { username: "plastic", categories: ["misc", "forensics"] },
    ];

    for (const category of categories) {
        await Category.create({ name: category });
    }

    for (const member of members) {
        const m = await Member.create({ username: member.username });
        for (const category of member.categories) {
            const c = await Category.findOne({ where: { name: category } });
            await m.addCategory(c);
            await c.addMember(m);
        }
    }

    // the forbidden member
    // banned for leaking our solve scripts
    const goroo = await Member.create({ username: "goroo", secret: process.env.FLAG || "corctf{test_flag}", kicked: true });
    const web = await Category.findOne({ where: { name: "web" } });
    await goroo.addCategory(web);
    await web.addMember(goroo);

    for (let i = 0; i < 25; i++) {
        const challCategory = categories[Math.floor(Math.random() * categories.length)];
        const date = new Date(Math.floor(Math.random() * 4) + 2020, Math.floor(Math.random() * 12), Math.floor(Math.random() * 31) + 1);

        // most CTFs feel like they're just named with random words anyway
        const ctfName = `${rword.generate(1, { capitalize: 'first', length: '4-6' })}CTF ${date.getFullYear()}`;
        // same thing with challenge names
        const challName = `${challCategory}/${rword.generate(1)}`;

        const title = `${ctfName} - ${challName} Writeup`;
        const content = rword.generate(1, { capitalize: 'first'}) + " " + rword.generate(500).join(" ") + ".<br /><br />Thanks for reading!<br /><br />";
        
        const writeup = await Writeup.create({ title, content, date, slug: slugify(title, { lower: true }), category: challCategory });
        const authors = members.filter(m => m.categories.includes(challCategory));
        const author = await Member.findByPk(authors[Math.floor(Math.random() * authors.length)].username);

        await writeup.setMember(author);
        await author.addWriteup(writeup);
    }
});

module.exports = { Category, Member, Writeup };