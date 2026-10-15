// Academic family tree of the people who studied generalized ODEs or non-absolute integration
// in the Brazilian group, and of the Prague mathematicians connected to it.
//
// WHO IS IN THE TREE
// People whose doctoral thesis uses generalized ODEs (Kurzweil's generalized differential
// equations) or Kurzweil–Henstock-type integrals, or who wrote on generalized ODEs afterwards
// (for example, chapters of the 2021 monograph of Bonotto, Federson and Mesquita).
// Advisors from other areas are not drawn; their names appear in the details of their students
// (`otherAdvisors`).
//
// HOW TO EDIT
// - One object per person. `id` is a short unique key; `advisors` lists the ids of the advisors
//   (and co-advisors) who are also in the tree: a line is drawn from each of them to the person.
//   Advisors who are not in the tree go in `otherAdvisors` (shown in the tooltip only).
// - `column` (optional) is the earliest column where the person may be drawn (0 = leftmost).
//   It keeps people of the same academic generation side by side; a person is always drawn at
//   least one column to the right of all of their advisors.
// - `lattes`: the 16-digit Lattes ID. When it is set, a click opens http://lattes.cnpq.br/<id>;
//   otherwise a click opens `link` (personal page, or the person's Mathematics Genealogy Project
//   page as a temporary fallback). Lattes IDs still to be filled are marked TODO.
// - `fields`: what the person works on now (shown on hover). Leave it out when unknown; the
//   tooltip then shows the PhD thesis instead.
// - `phd.year` is the year of the degree; for a PhD in progress use `phd.since` and `ongoing: true`.
// - `group`: "brazil" for the Brazilian group and its students abroad, "abroad" for the Prague school.
//
// NOT IN THE TREE (checked on 13 Oct 2026; add them back if they did work on generalized ODEs)
// - Advisors from other areas: Ralph Henstock, Patrick Muldowney, Ricardo Bianconi,
//   Sjoerd M. Verduyn Lunel, Carlos Gutierrez, Pierluigi Benevieri, Karina Schiabel, Marta Gadotti,
//   Hernán Henríquez.
// - Theses on other subjects: Daniela P. Demuner (2009, Poincaré–Bendixson on the Klein bottle),
//   André L. Furtado (2012, delay equations with impulses), Henrique C. dos Reis (2016, abstract
//   FDEs with state-dependent delays), Patrick de S. Oliveira (2025, Kolmogorov equation on time
//   scales), and Bonotto's students on impulsive semidynamical systems: Manuel F. Zuloeta Jimenez
//   (2014), Jaqueline da C. Ferreira (2016), Ginnara M. Souto (2017), Tiago A. Pacifico (2021),
//   Fabiano Pereira (2023), and Eric B. Santiago (2020, Klein–Gordon–Zakharov system).
// - To decide: their abstracts do not mention generalized ODEs, but they use Perron–Stieltjes
//   (Kurzweil-type) integrals: Márcia R. da Silva (2021, periodic solutions of neutral and measure
//   FDEs; advisors Bonotto and Afonso), Jucileide dos Santos (2025, Volterra–Stieltjes integral
//   equations; advisors J. G. Mesquita and R. Grau).
// - Subject unknown: Vinícius T. Azevedo (2023), and the PhDs in progress of Luíza G. Accarini,
//   Felipe G. Netto, André L. M. Tomaz da Silva and Ronaldo Murakami.
//
// SOURCES
// - Mathematics Genealogy Project (MGP), https://mathgenealogy.org: degrees, theses and advisors.
// - Lattes CVs as mirrored by Escavador (escavador.com/sobre/...): current position, "áreas de
//   atuação" (used for `fields`), supervisions and thesis titles.
// - Thesis abstracts (USP, UnB, USACH repositories) and personal pages: sites.icmc.usp.br/federson,
//   jaquelinemesquita.com, UNESP's Portal Docentes.
// - Bonotto, Federson, Mesquita (eds.), Generalized ODEs in Abstract Spaces and Applications,
//   Wiley, 2021 (foreword, preface, contents and list of contributors).

window.GENEALOGY = (() => {
const MGP = (id) => `https://mathgenealogy.org/id.php?id=${id}`;   // Mathematics Genealogy Project page

return {
  checked: "13 October 2026",
  people: [
    // ---------------------------------------------------------------- Prague
    {
      id: "kurzweil", label: "Jaroslav Kurzweil", name: "Jaroslav Kurzweil (1926–2022)",
      group: "abroad",
      phd: { school: "Charles University, Prague", year: 1949 }, otherAdvisors: ["Vojtěch Jarník"],
      fields: ["Introduced generalized ODEs and the Kurzweil integral (1957)"], deceased: true,
      link: MGP(130119),
    },
    {
      id: "schwabik", label: "Štefan Schwabik", name: "Štefan Schwabik (1941–2009)",
      group: "abroad", advisors: ["kurzweil"],
      phd: { school: "Czechoslovak Academy of Sciences", year: 1970, thesis: "Contributions to the theory of generalized differential equations" },
      fields: ["Generalized ODEs and Kurzweil integration; introduced generalized ODEs in Brazil (USP, 1989)"], deceased: true,
      link: MGP(160392),
    },
    {
      id: "tvrdy", label: "Milan Tvrdý", name: "Milan Tvrdý",
      group: "abroad", column: 1,
      phd: { school: "Czech Academy of Sciences", year: 1973, thesis: "Boundary value problems for generalized linear differential equations (in Czech)" },
      otherAdvisors: ["Otto Vejvoda"],
      link: MGP(162077),
    },
    {
      id: "slavik", label: "Antonín Slavík", name: "Antonín Slavík",
      group: "abroad", advisors: ["schwabik"],
      phd: { school: "Charles University, Prague", year: 2005, thesis: "Product integration, its history and applications" },
      link: "https://www.karlin.mff.cuni.cz/~slavik/index_en.html",
    },

    // ---------------------------------------------------------------- Brazil: first generation
    {
      id: "federson", label: "Márcia Federson", name: "Márcia Cristina Anderson Braz Federson",
      group: "brazil", column: 2, otherAdvisors: ["Ricardo Bianconi"], affiliation: "ICMC-USP, São Carlos",
      phd: { school: "USP", year: 1998, thesis: "On the existence of solutions of linear integral equations with respect to gauge integrals (in Portuguese)" },
      fields: ["Non-absolute integration", "Generalized ODEs", "Stochastic analysis and stochastic integration", "Quantum physics", "Drone dynamics"],
      lattes: "1945447546918726", // TODO
      link: "https://sites.icmc.usp.br/federson/",
    },
    {
      id: "frasson", label: "Miguel V. S. Frasson", name: "Miguel Vinícius Santini Frasson",
      group: "brazil", column: 2, otherAdvisors: ["Sjoerd M. Verduyn Lunel"], affiliation: "ICMC-USP, São Carlos",
      phd: { school: "Universiteit Leiden", year: 2005, thesis: "Large time behaviour of neutral delay systems" },
      fields: ["Functional differential equations", "Ordinary differential equations", "Impulsive differential equations"],
      lattes: "", // TODO
      link: MGP(133983),
    },

    // ---------------------------------------------------------------- students of Federson
    {
      id: "gimenes", label: "Luciene P. Gimenes", name: "Luciene Parron Gimenes Arantes (in memoriam)",
      group: "brazil", advisors: ["federson"], deceased: true,
      phd: { school: "USP", year: 2007, thesis: "Stability and oscillation of solutions of functional differential equations with delay and impulses (in Portuguese)" },
      link: MGP(143242),
    },
    {
      id: "bonotto", label: "Everaldo M. Bonotto", name: "Everaldo de Mello Bonotto",
      group: "brazil", advisors: ["federson"], otherAdvisors: ["Patrick Muldowney"], affiliation: "ICMC-USP, São Carlos",
      phd: { school: "USP", year: 2008, thesis: "A equação de Black–Scholes com ação impulsiva" },
      fields: ["Ordinary differential equations", "Impulsive differential equations", "Non-absolute integration", "Dynamical systems", "Functional differential equations"],
      lattes: "2183693074268993", // TODO
      link: "https://www.icmc.usp.br/pessoas/ebonotto/Home_Bonotto/Home.html",
    },
    {
      id: "afonso", label: "Suzete M. Afonso", name: "Suzete Maria Silva Afonso",
      group: "brazil", advisors: ["federson", "bonotto"], affiliation: "UNESP, Rio Claro",
      phd: { school: "USP", year: 2011, thesis: "Retarded functional differential equations with variable impulses via generalized ordinary differential equations" },
      fields: ["Functional differential equations", "Impulsive differential equations", "Generalized ODEs"],
      lattes: "3759335100023544",
    },
    {
      id: "monteiro", label: "Giselle A. Monteiro", name: "Giselle Antunes Monteiro",
      group: "brazil", advisors: ["federson", "tvrdy"], affiliation: "Institute of Mathematics, Czech Academy of Sciences, Prague",
      phd: { school: "USP", year: 2012, thesis: "Generalized linear differential equations in a Banach space: continuous dependence on parameters and applications" },
      lattes: "", // TODO
      link: MGP(162078),
    },
    {
      id: "jmesquita", label: "Jaqueline G. Mesquita", name: "Jaqueline Godoy Mesquita",
      group: "brazil", advisors: ["federson", "slavik"], affiliation: "IMECC-Unicamp",
      phd: { school: "USP", year: 2012, thesis: "Measure functional differential equations and impulsive functional dynamic equations on time scales" },
      fields: ["Functional differential equations", "Impulsive differential equations", "Generalized ODEs", "Dynamic equations on time scales", "Mathematical biology"],
      lattes: "7249985370010988",
    },
    {
      id: "toon", label: "Eduard Toon", name: "Eduard Toon",
      group: "brazil", advisors: ["federson"], affiliation: "UFJF",
      phd: { school: "USP", year: 2012, thesis: "Generalized ordinary differential equations and applications to classic differential equations" },
      fields: ["Functional differential equations", "Generalized ODEs", "Dynamic equations on time scales", "Ordinary differential equations", "Partial differential equations"],
      lattes: "", // TODO
      link: MGP(166924),
    },
    {
      id: "collegari", label: "Rodolfo Collegari", name: "Rodolfo Collegari",
      group: "brazil", advisors: ["federson"], affiliation: "UFU",
      phd: { school: "USP", year: 2014, thesis: "Linear generalized ordinary differential equations and applications to linear functional differential equations" },
      fields: ["Impulsive dynamical systems", "Nonlinear dynamical systems", "Generalized ODEs", "Functional differential equations"],
      lattes: "1839122732302908", // TODO
    },
    {
      id: "grau", label: "Rogelio Grau", name: "Rogelio Grau Acuña",
      group: "brazil", advisors: ["federson", "jmesquita"], affiliation: "Universidad del Norte, Barranquilla, Colombia",
      phd: { school: "USP", year: 2016, thesis: "Properties of autonomous generalized differential equations and applications to functional differential equations" },
      lattes: "", // TODO
      link: MGP(218628),
    },
    {
      id: "flsantos", label: "Fábio L. Santos", name: "Fábio Lima Santos",
      group: "brazil", advisors: ["federson", "bonotto"], affiliation: "UFS",
      phd: { school: "USP", year: 2016, thesis: "Dichotomies in generalized ODEs and applications" },
      lattes: "", // TODO
      link: MGP(265564),
    },
    {
      id: "mcmesquita", label: "Maria Carolina Mesquita", name: "Maria Carolina Stefani Mesquita Macena",
      group: "brazil", advisors: ["federson"], otherAdvisors: ["Karina Schiabel"],
      phd: { school: "UFSCar", year: 2019, thesis: "Applications of topological degree theory to generalized ODEs" },
      lattes: "", // TODO
      link: MGP(332721),
    },
    {
      id: "fernanda", label: "Fernanda A. da Silva", name: "Fernanda Andrade da Silva",
      group: "brazil", advisors: ["federson", "toon"], affiliation: "UFSCar, São Carlos",
      phd: { school: "USP", year: 2021, thesis: "Controllability in generalized nonlinear ODEs and applications" },
      fields: ["Measure differential equations", "Generalized ODEs", "Dynamic Equations on Time Scales", "Non-linear Stochastic dynamical systems"],
      lattes: "0997296959543980",
    },
    {
      id: "marielle", label: "Marielle A. Silva", name: "Marielle Aparecida Silva",
      group: "brazil", advisors: ["federson"], otherAdvisors: ["Marta Gadotti"], affiliation: "UTFPR",
      phd: { school: "USP", year: 2021, thesis: "Oscillation theory for generalized ordinary differential equations and applications to other types of equations" },
      fields: ["Generalized ODEs", "Impulsive dynamical systems"],
      lattes: "2059104126592873",
    },

    {
      id: "amavsantos", label: "Antonio dos Santos", name: "Antonio Martins Alves Veloso dos Santos",
      group: "brazil", advisors: ["federson", "collegari"], ongoing: true,
      phd: { school: "USP", since: 2021, topic: "Persistência, permanência e extinção para equações diferenciais ou integrodiferenciais estocásticas envolvendo funções Itô–Kurzweil–Henstock integráveis" },
      lattes: "0322441941380469", // TODO
      link: "https://www.escavador.com/sobre/560493523/antonio-martins-alves-veloso-dos-santos",
    },
    {
      id: "lglopes", label: "Luiz G. de C. Lopes", name: "Luiz Guilherme de Carvalho Lopes",
      group: "brazil", advisors: ["federson"], ongoing: true,
      phd: { school: "ICMC-USP", since: 2024, topic: "Estudo de certas propriedades qualitativas de Equações Estocásticas Generalizadas" },
      lattes: "", // TODO
    },

    // ---------------------------------------------------------------- students of Bonotto
    {
      id: "destro", label: "Lucas H. Destro", name: "Lucas Henrique Destro de Toledo",
      group: "brazil", advisors: ["bonotto"], otherAdvisors: ["Tomás Caraballo Garrido"], ongoing: true,
      phd: { since: 2023 },
      lattes: "9506544965516142", // TODO
    },

    // ---------------------------------------------------------------- students of Frasson
    // Both wrote, with Frasson, Chapter 15 of the 2021 monograph (neutral FDEs via generalized ODEs).
    {
      id: "tacuri", label: "Patricia H. Tacuri", name: "Patricia Hilario Tacuri",
      group: "brazil", advisors: ["frasson"],
      phd: { school: "USP", year: 2013, thesis: "Neutral functional differential equations, asymptotic behaviour and representation" },
      fields: ["Functional differential equations"],
      lattes: "", // TODO
      link: MGP(174283),
    },
    {
      id: "fgandrade", label: "Fernando G. de Andrade", name: "Fernando Gomes de Andrade",
      group: "brazil", advisors: ["frasson"], affiliation: "UFPI, Bom Jesus",
      phd: { school: "USP", year: 2019, thesis: "Propriedades das soluções de equações diferenciais em medida" },
      fields: ["Functional differential equations"],
      lattes: "", // TODO
      link: "https://www.escavador.com/sobre/583472/fernando-gomes-de-andrade",
    },

    // ---------------------------------------------------------------- students of J. G. Mesquita
    {
      id: "gallegos", label: "Claudio A. Gallegos", name: "Claudio A. Gallegos", group: "brazil",
      advisors: ["jmesquita"], otherAdvisors: ["Hernán Henríquez"], affiliation: "Universidad de Chile",
      phd: { school: "Universidad de Santiago de Chile", year: 2019, thesis: "Qualitative properties on measure differential and measure functional differential equations (first part)" },
      link: "https://portafolio-academico.uchile.cl/perfil/623705-Claudio-Andres-Gallegos-Castro",
    },
    {
      id: "lafeta", label: "Anna Carolina Lafetá", name: "Anna Carolina Martins Machado Lafetá", group: "brazil",
      advisors: ["jmesquita"],
      phd: { school: "UnB", year: 2022, thesis: "Functional Volterra–Stieltjes integral equations" },
      lattes: "", // TODO
    },

    // ---------------------------------------------------------------- students of Afonso
    {
      id: "lucas", label: "Lucas Ozaki Mizuguti", name: "Lucas Ozaki Mizuguti", group: "brazil", advisors: ["afonso"], ongoing: true,
      otherAdvisors: ["Tomás Caraballo Garrido"],
      highlight: true,   // drawn in blue: the author of this site
      affiliation: "IBILCE-UNESP, São José do Rio Preto",
      phd: { school: "UNESP and Universidad de Sevilla (joint degree)", since: 2022 },
      fields: ["Generalized ODEs", "Generalized Stochastic Equations", "Stability theory", "Measure integral equations", "Interactive Fuzzy Dynamics"],
      lattes: "7382968551044037", // TODO: your own Lattes ID
      link: "/",
    },
  ],
};
})();
