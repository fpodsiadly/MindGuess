import { PrismaClient, TraitValue } from "@prisma/client";

const prisma = new PrismaClient();

type TraitDef = {
  key: string;
  question: string;
  yesTags: string[];
  falseTags?: string[];
};

const traitDefs: TraitDef[] = [
  {
    key: "pochodzi-z-polski",
    question: "Czy ta osoba pochodzi z Polski?",
    yesTags: ["pl"],
    falseTags: ["eu", "na", "sa", "asia", "africa", "oceania"],
  },
  {
    key: "pochodzi-z-europy",
    question: "Czy ta osoba pochodzi z Europy?",
    yesTags: ["eu", "pl"],
    falseTags: ["na", "sa", "asia", "africa", "oceania"],
  },
  {
    key: "pochodzi-z-ameryki-polnocnej",
    question: "Czy ta osoba pochodzi z Ameryki Północnej?",
    yesTags: ["na"],
    falseTags: ["eu", "pl", "sa", "asia", "africa", "oceania"],
  },
  {
    key: "pochodzi-z-ameryki-poludniowej",
    question: "Czy ta osoba pochodzi z Ameryki Południowej?",
    yesTags: ["sa"],
    falseTags: ["eu", "pl", "na", "asia", "africa", "oceania"],
  },
  {
    key: "pochodzi-z-azji",
    question: "Czy ta osoba pochodzi z Azji?",
    yesTags: ["asia"],
    falseTags: ["eu", "pl", "na", "sa", "africa", "oceania"],
  },
  {
    key: "pochodzi-z-afryki",
    question: "Czy ta osoba pochodzi z Afryki?",
    yesTags: ["africa"],
    falseTags: ["eu", "pl", "na", "sa", "asia", "oceania"],
  },
  {
    key: "pochodzi-z-oceanii",
    question: "Czy ta osoba pochodzi z Oceanii?",
    yesTags: ["oceania"],
    falseTags: ["eu", "pl", "na", "sa", "asia", "africa"],
  },
  {
    key: "kobieta",
    question: "Czy to kobieta?",
    yesTags: ["female"],
    falseTags: ["male"],
  },
  {
    key: "zyje",
    question: "Czy ta osoba żyje?",
    yesTags: ["alive"],
    falseTags: ["dead"],
  },
  {
    key: "naukowiec",
    question: "Czy ta osoba jest naukowcem lub inżynierem?",
    yesTags: ["science"],
  },
  {
    key: "technologia",
    question: "Czy ta osoba jest znana z branży technologicznej lub startupów?",
    yesTags: ["tech"],
  },
  {
    key: "polityk",
    question: "Czy ta osoba jest politykiem lub przywódcą państwa?",
    yesTags: ["politics"],
  },
  {
    key: "sportowiec",
    question: "Czy ta osoba jest sportowcem?",
    yesTags: ["sport"],
  },
  {
    key: "pilkarz",
    question: "Czy ta osoba jest piłkarzem/piłkarką?",
    yesTags: ["football"],
  },
  {
    key: "koszykarz",
    question: "Czy ta osoba jest koszykarzem/koszykarką?",
    yesTags: ["basketball"],
  },
  {
    key: "tenisista",
    question: "Czy ta osoba jest tenisistą/tenisistką?",
    yesTags: ["tennis"],
  },
  {
    key: "medalista-olimpijski",
    question: "Czy ta osoba zdobyła medal olimpijski?",
    yesTags: ["olympics"],
  },
  {
    key: "muzyk",
    question: "Czy ta osoba jest muzykiem lub wokalistą?",
    yesTags: ["music"],
  },
  {
    key: "aktor",
    question: "Czy ta osoba jest aktorem/aktorką?",
    yesTags: ["actor"],
  },
  {
    key: "pisarz",
    question: "Czy ta osoba jest pisarzem/pisarką?",
    yesTags: ["writer"],
  },
  {
    key: "noblista",
    question: "Czy ta osoba otrzymała Nagrodę Nobla?",
    yesTags: ["nobel"],
  },
  {
    key: "fikcyjna",
    question: "Czy to postać fikcyjna?",
    yesTags: ["fiction"],
  },
];

type PersonSeed = {
  name: string;
  tags: string[];
};

const people: PersonSeed[] = [
  { name: "Maria Skłodowska-Curie", tags: ["pl", "eu", "science", "nobel", "dead", "female"] },
  { name: "Mikołaj Kopernik", tags: ["pl", "eu", "science", "dead"] },
  { name: "Lech Wałęsa", tags: ["pl", "eu", "politics", "alive"] },
  { name: "Robert Lewandowski", tags: ["pl", "eu", "sport", "football", "alive"] },
  { name: "Iga Świątek", tags: ["pl", "eu", "sport", "tennis", "alive", "female"] },
  { name: "Adam Małysz", tags: ["pl", "eu", "sport", "olympics", "alive"] },
  { name: "Wisława Szymborska", tags: ["pl", "eu", "writer", "nobel", "dead", "female"] },
  { name: "Olga Tokarczuk", tags: ["pl", "eu", "writer", "nobel", "alive", "female"] },
  { name: "Andrzej Wajda", tags: ["pl", "eu", "actor", "dead"] },
  { name: "Krzysztof Penderecki", tags: ["pl", "eu", "music", "dead"] },
  { name: "Fryderyk Chopin", tags: ["pl", "eu", "music", "dead"] },
  { name: "Czesław Miłosz", tags: ["pl", "eu", "writer", "nobel", "dead"] },
  { name: "Henryk Sienkiewicz", tags: ["pl", "eu", "writer", "nobel", "dead"] },
  { name: "Stanisław Lem", tags: ["pl", "eu", "writer", "dead"] },
  { name: "Andrzej Sapkowski", tags: ["pl", "eu", "writer", "alive"] },
  { name: "Nikola Tesla", tags: ["eu", "science", "dead"] },
  { name: "Albert Einstein", tags: ["eu", "science", "nobel", "dead"] },
  { name: "Isaac Newton", tags: ["eu", "science", "dead"] },
  { name: "Charles Darwin", tags: ["eu", "science", "dead"] },
  { name: "Stephen Hawking", tags: ["eu", "science", "dead"] },
  { name: "Tim Berners-Lee", tags: ["eu", "science", "tech", "alive"] },
  { name: "Ada Lovelace", tags: ["eu", "science", "dead", "female"] },
  { name: "Alan Turing", tags: ["eu", "science", "dead"] },
  { name: "Grace Hopper", tags: ["na", "science", "tech", "dead", "female"] },
  { name: "Katherine Johnson", tags: ["na", "science", "dead", "female"] },
  { name: "Rosalind Franklin", tags: ["eu", "science", "dead", "female"] },
  { name: "Elon Musk", tags: ["na", "tech", "alive"] },
  { name: "Steve Jobs", tags: ["na", "tech", "dead"] },
  { name: "Bill Gates", tags: ["na", "tech", "alive"] },
  { name: "Mark Zuckerberg", tags: ["na", "tech", "alive"] },
  { name: "Jeff Bezos", tags: ["na", "tech", "alive"] },
  { name: "Malala Yousafzai", tags: ["asia", "politics", "alive", "female", "nobel"] },
  { name: "Nelson Mandela", tags: ["africa", "politics", "nobel", "dead"] },
  { name: "Barack Obama", tags: ["na", "politics", "alive", "nobel"] },
  { name: "Angela Merkel", tags: ["eu", "politics", "alive", "female"] },
  { name: "Emmanuel Macron", tags: ["eu", "politics", "alive"] },
  { name: "Mahatma Gandhi", tags: ["asia", "politics", "dead", "nobel"] },
  { name: "Winston Churchill", tags: ["eu", "politics", "dead", "nobel"] },
  { name: "Margaret Thatcher", tags: ["eu", "politics", "dead", "female"] },
  { name: "Volodymyr Zełenski", tags: ["eu", "politics", "alive"] },
  { name: "Justin Trudeau", tags: ["na", "politics", "alive"] },
  { name: "Lionel Messi", tags: ["sa", "sport", "football", "alive", "olympics"] },
  { name: "Cristiano Ronaldo", tags: ["eu", "sport", "football", "alive"] },
  { name: "Kylian Mbappé", tags: ["eu", "sport", "football", "alive"] },
  { name: "Neymar", tags: ["sa", "sport", "football", "alive"] },
  { name: "Zinedine Zidane", tags: ["eu", "sport", "football", "alive"] },
  { name: "Diego Maradona", tags: ["sa", "sport", "football", "dead"] },
  { name: "Pelé", tags: ["sa", "sport", "football", "dead"] },
  { name: "Johan Cruyff", tags: ["eu", "sport", "football", "dead"] },
  { name: "Luka Modrić", tags: ["eu", "sport", "football", "alive"] },
  { name: "Erling Haaland", tags: ["eu", "sport", "football", "alive"] },
  { name: "Michael Jordan", tags: ["na", "sport", "basketball", "alive", "olympics"] },
  { name: "LeBron James", tags: ["na", "sport", "basketball", "alive", "olympics"] },
  { name: "Kobe Bryant", tags: ["na", "sport", "basketball", "dead", "olympics"] },
  { name: "Shaquille O'Neal", tags: ["na", "sport", "basketball", "alive", "olympics"] },
  { name: "Magic Johnson", tags: ["na", "sport", "basketball", "alive", "olympics"] },
  { name: "Stephen Curry", tags: ["na", "sport", "basketball", "alive", "olympics"] },
  { name: "Serena Williams", tags: ["na", "sport", "tennis", "alive", "olympics", "female"] },
  { name: "Roger Federer", tags: ["eu", "sport", "tennis", "alive", "olympics"] },
  { name: "Rafael Nadal", tags: ["eu", "sport", "tennis", "alive", "olympics"] },
  { name: "Novak Djokovic", tags: ["eu", "sport", "tennis", "alive"] },
  { name: "Naomi Osaka", tags: ["asia", "sport", "tennis", "alive", "female"] },
  { name: "Martina Navratilova", tags: ["eu", "sport", "tennis", "alive", "olympics", "female"] },
  { name: "Usain Bolt", tags: ["na", "sport", "olympics", "alive"] },
  { name: "Michael Phelps", tags: ["na", "sport", "olympics", "alive"] },
  { name: "Simone Biles", tags: ["na", "sport", "olympics", "alive", "female"] },
  { name: "Katie Ledecky", tags: ["na", "sport", "olympics", "alive", "female"] },
  { name: "Alina Zagitova", tags: ["asia", "sport", "olympics", "alive", "female"] },
  { name: "Mo Farah", tags: ["eu", "sport", "olympics", "alive"] },
  { name: "Yao Ming", tags: ["asia", "sport", "basketball", "alive"] },
  { name: "Dirk Nowitzki", tags: ["eu", "sport", "basketball", "alive", "olympics"] },
  { name: "Beyoncé", tags: ["na", "music", "alive", "female"] },
  { name: "Taylor Swift", tags: ["na", "music", "alive", "female"] },
  { name: "Rihanna", tags: ["na", "music", "alive", "female"] },
  { name: "Ed Sheeran", tags: ["eu", "music", "alive"] },
  { name: "Adele", tags: ["eu", "music", "alive", "female"] },
  { name: "Freddie Mercury", tags: ["africa", "music", "dead"] },
  { name: "Michael Jackson", tags: ["na", "music", "dead"] },
  { name: "Elvis Presley", tags: ["na", "music", "dead"] },
  { name: "Bob Marley", tags: ["na", "music", "dead"] },
  { name: "Lady Gaga", tags: ["na", "music", "alive", "female"] },
  { name: "Johann Sebastian Bach", tags: ["eu", "music", "dead"] },
  { name: "Ludwig van Beethoven", tags: ["eu", "music", "dead"] },
  { name: "Wolfgang Amadeus Mozart", tags: ["eu", "music", "dead"] },
  { name: "Hans Zimmer", tags: ["eu", "music", "alive"] },
  { name: "Celine Dion", tags: ["na", "music", "alive", "female"] },
  { name: "Shakira", tags: ["sa", "music", "alive", "female"] },
  { name: "Jennifer Lopez", tags: ["na", "music", "actor", "alive", "female"] },
  { name: "Meryl Streep", tags: ["na", "actor", "alive", "female"] },
  { name: "Leonardo DiCaprio", tags: ["na", "actor", "alive"] },
  { name: "Tom Hanks", tags: ["na", "actor", "alive"] },
  { name: "Scarlett Johansson", tags: ["na", "actor", "alive", "female"] },
  { name: "Natalie Portman", tags: ["na", "actor", "alive", "female"] },
  { name: "Dwayne Johnson", tags: ["na", "actor", "alive"] },
  { name: "Keanu Reeves", tags: ["na", "actor", "alive"] },
  { name: "Jackie Chan", tags: ["asia", "actor", "alive"] },
  { name: "Amitabh Bachchan", tags: ["asia", "actor", "alive"] },
  { name: "Pedro Pascal", tags: ["sa", "actor", "alive"] },
  { name: "Cate Blanchett", tags: ["oceania", "actor", "alive", "female"] },
  { name: "Hugh Jackman", tags: ["oceania", "actor", "alive"] },
  { name: "Emma Watson", tags: ["eu", "actor", "alive", "female"] },
  { name: "J.K. Rowling", tags: ["eu", "writer", "alive", "female"] },
  { name: "George R.R. Martin", tags: ["na", "writer", "alive"] },
  { name: "Agatha Christie", tags: ["eu", "writer", "dead", "female"] },
  { name: "Ernest Hemingway", tags: ["na", "writer", "dead"] },
  { name: "Gabriel García Márquez", tags: ["sa", "writer", "dead", "nobel"] },
  { name: "Haruki Murakami", tags: ["asia", "writer", "alive"] },
  { name: "Chinua Achebe", tags: ["africa", "writer", "dead"] },
  { name: "Chimamanda Ngozi Adichie", tags: ["africa", "writer", "alive", "female"] },
  { name: "Stephen King", tags: ["na", "writer", "alive"] },
  { name: "J.R.R. Tolkien", tags: ["eu", "writer", "dead"] },
  { name: "Henryk Ibsen", tags: ["eu", "writer", "dead"] },
  { name: "Voltaire", tags: ["eu", "writer", "dead"] },
  { name: "Niels Bohr", tags: ["eu", "science", "nobel", "dead"] },
  { name: "Marie Curie", tags: ["eu", "science", "nobel", "dead", "female"] },
  { name: "Alfred Nobel", tags: ["eu", "science", "dead"] },
];

const toValue = (tags: string[], def: TraitDef): TraitValue => {
  if (def.yesTags.some((tag) => tags.includes(tag))) return TraitValue.TRUE;
  if (def.falseTags && def.falseTags.some((tag) => tags.includes(tag))) return TraitValue.FALSE;
  return TraitValue.UNKNOWN;
};

async function main() {
  for (const trait of traitDefs) {
    await prisma.trait.upsert({
      where: { key: trait.key },
      update: { question: trait.question },
      create: { key: trait.key, question: trait.question },
    });
  }

  for (const person of people) {
    const traitValues = traitDefs
      .map((def) => ({
        def,
        value: toValue(person.tags, def),
      }))
      .filter(({ value }) => value !== TraitValue.UNKNOWN)
      .map(({ def, value }) => ({
        trait: { connect: { key: def.key } },
        value,
      }));

    await prisma.person.upsert({
      where: { name: person.name },
      update: {},
      create: {
        name: person.name,
        traits: {
          create: traitValues,
        },
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
