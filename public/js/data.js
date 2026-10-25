// RAGHULVERSE content layer.
// Everything shown in the game and in Quick Portfolio comes from this file.
// Source of truth: the resume details supplied in the project brief.
// Fields set to null are intentionally unfilled (never invented) - see README "Content to confirm".

export const PROFILE = {
  name: 'Raghul S',
  role: 'Data Science and Business Systems Student',
  programme: 'Integrated M.Tech in Computer Science Engineering',
  specialization: 'Data Science',
  institution: 'SRM Institute of Science and Technology, Kattankulathur',
  year: 'Third year',
  cgpa: '8.85',
  email: 'sraghul240@gmail.com',
  github: 'https://github.com/raghul2007',
  // Supplied by Raghul directly (not in the resume text).
  linkedin: 'https://www.linkedin.com/in/raghul-s-82bb3a324',
  location: 'Kattankulathur, Chennai',
  resumeUrl: 'documents/Raghul_S_Resume.pdf',
  interests: ['Software development', 'Artificial intelligence', 'Machine learning', 'Analytics', 'Cloud technologies'],
  tagline: 'One Campus. One Journey. A Thousand Possibilities.',
};

export const INTRO_NARRATION =
  "Hey! Welcome to my world. I'm Raghul S, a Computer Science Engineering student specializing in Data Science at SRM Institute of Science and Technology, Kattankulathur. " +
  "Instead of reading my portfolio like a normal webpage, why don't you explore it with me? " +
  'Every building has a story, every lab represents something I\'ve learned, and every mission reveals another part of my journey.';

export const EDUCATION = [
  {
    id: 'mtech',
    level: 'Integrated M.Tech, Computer Science Engineering, Data Science specialization',
    school: 'SRM Institute of Science and Technology (SRMIST)',
    years: '2024–2029',
    score: 'CGPA 8.85',
  },
  {
    id: 'xii',
    level: 'Class XII',
    school: 'JRK Matric Higher Secondary School, Kattankulathur',
    years: '2023–2024',
    score: '86.3%',
  },
  {
    id: 'x',
    level: 'Class X',
    school: 'TMS Matric School, Rail Nagar',
    years: '2021–2022',
    score: '71%',
  },
];

export const SKILL_GROUPS = [
  { id: 'prog', name: 'Programming', icon: 'code', items: ['Python', 'Java', 'C', 'C++', 'MATLAB'], snippet: ['>>> import this', '>>> print("Hello, SRM KTR")', 'Hello, SRM KTR'] },
  { id: 'web', name: 'Web development', icon: 'globe', items: ['HTML', 'CSS', 'JavaScript', 'React', 'Angular', 'Node.js', 'Next.js', 'Django', 'Bootstrap'], snippet: ['$ npm run dev', 'ready - started server on 0.0.0.0:3000'] },
  { id: 'db', name: 'Databases', icon: 'database', items: ['SQL', 'MySQL', 'Database Management'], snippet: ['mysql> SELECT skill FROM toolkit;', '3 rows in set'] },
  { id: 'ai', name: 'AI and machine learning', icon: 'brain', items: ['Machine Learning', 'Deep Learning', 'Generative AI', 'NLP', 'RAG', 'Large Language Models'], snippet: ['model.fit(X_train, y_train)', 'epoch 1/1 ...'] },
  { id: 'fw', name: 'Frameworks', icon: 'layers', items: ['TensorFlow', 'PyTorch', 'Keras', 'LangChain', 'LangGraph'], snippet: ['import torch', 'torch.cuda.is_available()'] },
  { id: 'data', name: 'Data science and analytics', icon: 'chart', items: ['Pandas', 'NumPy', 'Matplotlib', 'Power BI', 'Tableau', 'Data Analysis', 'Data Visualization'], snippet: ['df.describe()', 'df.groupby("category").mean()'] },
  { id: 'cloud', name: 'Cloud', icon: 'cloud', items: ['AWS', 'Google Cloud'], snippet: ['$ gcloud config list', '[core] project = lab'] },
  { id: 'devops', name: 'DevOps and tools', icon: 'wrench', items: ['Git', 'GitHub', 'Docker', 'Kubernetes', 'CI/CD'], snippet: ['$ git commit -m "ship it"', '$ docker build .'] },
];

export const PRACTICE_AREAS = [
  'AI-powered applications',
  'Machine learning and data analytics projects',
  'Generative AI and RAG-based applications',
  'Data analysis and visualization',
];

// No named project repositories were supplied. Add real ones here and they appear
// in Full-Stack Hub, Quick Portfolio and the Career Centre: { title, description, stack:[], url, image }
export const PROJECTS = [];

export const ACHIEVEMENTS = [
  { id: 'a1', title: 'Third prize - National Level Hackathon Symposium', type: 'prize', text: 'Secured third prize in the National Level Hackathon Symposium.' },
  { id: 'a2', title: 'National Level Hackathon - Astral Web Innovate', type: 'participation', text: 'Participated in the National Level Hackathon - Astral Web Innovate.' },
  { id: 'a3', title: 'National Level Designathon', type: 'participation', text: 'Participated in a National Level Designathon.' },
];

export const CERT_CATEGORIES = [
  'Key certifications',
  'AI and machine learning',
  'Data science and analytics',
  'Software development',
  'Cloud',
  'Databases',
  'Programming',
  'Networking',
];

// credentialUrl / image stay null until the real certificate is supplied. Never invent dates, IDs or scores.
const c = (title, issuer, category) => ({ title, issuer, category, credentialUrl: null, image: null });
export const CERTIFICATIONS = [
  c('IBM AI Engineering', 'IBM', 'Key certifications'),
  c('IBM Data Science', 'IBM', 'Key certifications'),
  c('IBM DevOps and Software Engineering', 'IBM', 'Key certifications'),
  c('Microsoft Power BI Data Analyst', 'Microsoft', 'Key certifications'),
  c('AWS Cloud Solutions Architect', 'AWS', 'Key certifications'),
  c('Amazon Junior Software Developer', 'Amazon', 'Key certifications'),
  c('DeepLearning.AI Machine Learning', 'DeepLearning.AI', 'Key certifications'),
  c('DeepLearning.AI Deep Learning', 'DeepLearning.AI', 'Key certifications'),
  c('Tableau Business Intelligence Analyst', 'Tableau', 'Key certifications'),
  c('IBM RAG and Agentic AI', 'IBM', 'AI and machine learning'),
  c('Google AI', 'Google', 'AI and machine learning'),
  c('Google Data Analytics', 'Google', 'Data science and analytics'),
  c('Google Advanced Data Analytics', 'Google', 'Data science and analytics'),
  c('Data Analysis with Tableau', 'Tableau', 'Data science and analytics'),
  c('Advanced Data Visualization with Tableau', 'Tableau', 'Data science and analytics'),
  c('Amazon Full Stack Web Development', 'Amazon', 'Software development'),
  c('Algorithms', 'Stanford (Coursera)', 'Software development'),
  c('Google Cloud Digital Leader Training', 'Google Cloud', 'Cloud'),
  c('Microsoft SQL Server', 'Microsoft', 'Databases'),
  c('Amazon Database Management with Java and SQL', 'Amazon', 'Databases'),
  c('NPTEL Database Management Systems', 'NPTEL', 'Databases'),
  c('Oracle Certified Professional: Java SE 11 Developer', 'Oracle', 'Programming'),
  c('Amazon Programming with Java', 'Amazon', 'Programming'),
  c('NPTEL Programming in Java', 'NPTEL', 'Programming'),
  c('NPTEL Fundamentals of Object Oriented Programming', 'NPTEL', 'Programming'),
  c('NPTEL Data Structures and Algorithms', 'NPTEL', 'Programming'),
  c('Udemy Java Programming', 'Udemy', 'Programming'),
  c('Cisco Networking Basics', 'Cisco', 'Networking'),
  c('Cisco Networking Devices and Initial Configuration', 'Cisco', 'Networking'),
];

// Innovation initiative. Name confirmed by Raghul as "Tesseract Labs". The longer form
// "Tesseract Labs of Innovation and AI Technology" from the brief is not yet confirmed, so it is not used.
// Description/links stay null until supplied. Do not add registration, revenue, team size or clients.
export const STARTUP = {
  name: 'Tesseract Labs',
  description: null,
  url: null,
};

// ---------------------------------------------------------------- world / missions
export const MAP = { cols: 64, rows: 44, tile: 32 };

// rect = building footprint in tiles. door = tile the visitor stands near.
// verified:true only for entities the SRMIST brochure confirms exist on the KTR campus in this role.
export const MISSIONS = [
  {
    id: 'gate', order: 1, kind: 'about', title: 'Welcome Gate', subtitle: 'About Me', place: 'University Entrance',
    badge: 'Campus Explorer', token: 'Python', color: '#1f6feb', accent: '#ffd166', required: true,
    rect: null, door: { x: 32, y: 36 },
    summary: 'Meet Raghul S: programme, specialization, year and CGPA.',
    narration:
      "I'm Raghul S, currently pursuing an Integrated M.Tech in Computer Science Engineering with a specialization in Data Science at SRM KTR. " +
      'My interests include software development, artificial intelligence, machine learning, analytics, and cloud technologies. ' +
      'I enjoy applying what I learn through practical projects, technical challenges, and hackathons.',
  },
  {
    id: 'academic', order: 2, kind: 'education', title: 'Academic Block', subtitle: 'Education', place: 'Academic Block (portfolio pavilion)',
    badge: 'Knowledge Seeker', token: 'SQL', color: '#3b82c4', accent: '#ffd166', required: true,
    rect: { x: 8, y: 29, w: 10, h: 6 }, door: { x: 13, y: 35 },
    summary: 'Interactive timeline: SRMIST, Class XII, Class X.',
    narration:
      'My academic journey has helped me build a foundation in computer science, programming, databases, and data science. ' +
      'I am continuing to develop these skills through coursework and practical technical work.',
  },
  {
    id: 'proglab', order: 3, kind: 'skills', title: 'Programming Lab', subtitle: 'Technical Skills', place: 'Programming Lab (portfolio pavilion)',
    badge: 'Code Explorer', token: 'Java', color: '#2b6cb0', accent: '#38e1ff', required: true,
    rect: { x: 46, y: 29, w: 10, h: 6 }, door: { x: 51, y: 35 },
    summary: 'Eight terminals, one per skill category.',
    narration:
      'I work across programming, web development, data science, AI, and cloud technologies. ' +
      'My technical toolkit includes languages such as Python and Java, web frameworks, database technologies, machine learning libraries, and modern development tools. ' +
      'These skills support my interest in building useful software and data-driven applications.',
  },
  {
    id: 'ai', order: 4, kind: 'ai', title: 'AI and Data Science Centre', subtitle: 'AI and Data', place: 'AI and Data Science Centre (portfolio pavilion)',
    badge: 'AI Explorer', token: 'TensorFlow', color: '#5b3fd0', accent: '#38e1ff', required: true,
    rect: { x: 8, y: 17, w: 10, h: 6 }, door: { x: 13, y: 23 },
    summary: 'Five stations: ML, deep learning, GenAI, RAG, analytics.',
    narration:
      'This is where artificial intelligence and data meet. ' +
      'My practical work includes AI-powered applications, machine learning, data analytics, and Generative AI or RAG-based applications. ' +
      "I'm interested in building systems that turn data and language models into useful solutions.",
  },
  {
    id: 'fullstack', order: 5, kind: 'fullstack', title: 'Full-Stack Development Hub', subtitle: 'Web Development', place: 'Full-Stack Hub (portfolio pavilion)',
    badge: 'Builder', token: 'React', color: '#0e8a7d', accent: '#ffd166', required: true,
    rect: { x: 46, y: 17, w: 10, h: 6 }, door: { x: 51, y: 23 },
    summary: 'Stack overview, a working terminal and a labelled mini demo.',
    narration:
      'I enjoy building web applications and exploring both frontend and backend technologies. ' +
      'My full-stack development work includes web applications using HTML, CSS, JavaScript, and modern frameworks. ' +
      'I also use GitHub to maintain software projects and develop my practical skills.',
  },
  {
    id: 'cloud', order: 6, kind: 'cloud', title: 'Cloud and Networking Centre', subtitle: 'Cloud and Networks', place: 'Cloud and Networking Centre (portfolio pavilion)',
    badge: 'Cloud Navigator', token: 'AWS', color: '#1a73a8', accent: '#38e1ff', required: true,
    rect: { x: 8, y: 5, w: 10, h: 6 }, door: { x: 13, y: 11 },
    summary: 'Cloud skills plus a playable network-connection puzzle.',
    narration:
      'Cloud computing and networking help me understand how applications operate beyond the local computer. ' +
      'My learning includes AWS and Google Cloud concepts, cloud labs, and networking topics such as VLANs, DHCP, DNS, NAT/PAT, and access control lists. ' +
      "I'm also developing my understanding of modern deployment and container technologies.",
  },
  {
    id: 'achievements', order: 7, kind: 'achievements', title: 'Achievements and Events Hall', subtitle: 'Achievements', place: 'Achievements Hall (portfolio pavilion)',
    badge: 'Innovator', token: 'Git', color: '#b9770e', accent: '#ffd166', required: true,
    rect: { x: 46, y: 5, w: 10, h: 6 }, door: { x: 51, y: 11 },
    summary: 'Hackathon and designathon highlights.',
    narration:
      'Participating in hackathons and designathons has given me opportunities to explore ideas, solve problems, and collaborate around technology. ' +
      'One of my highlights is securing third prize in a national-level hackathon symposium.',
  },
  {
    id: 'library', order: 8, kind: 'certs', title: 'Certification Library', subtitle: 'Certifications', place: 'Certification Library (portfolio pavilion)',
    badge: 'Lifelong Learner', token: 'Docker', color: '#7a4b2a', accent: '#ffd166', required: true,
    rect: { x: 26, y: 16, w: 12, h: 6 }, door: { x: 32, y: 22 },
    summary: 'Searchable, filterable certification catalogue.',
    narration:
      "I've continued building my technical foundation through certifications in AI, data science, software development, analytics, databases, cloud computing, and networking. " +
      'These learning experiences complement my coursework and practical projects.',
  },
  {
    id: 'innovation', order: 9, kind: 'innovation', title: 'Innovation and Startup Pavilion', subtitle: 'Innovation', place: 'Innovation Pavilion (portfolio pavilion)',
    badge: "Innovator's Mindset", token: 'LangChain', color: '#7c3aed', accent: '#38e1ff', required: false,
    rect: { x: 22, y: 28, w: 6, h: 5 }, door: { x: 25, y: 33 },
    summary: 'Optional: innovation ideas, experiments and goals.',
    narration:
      'I enjoy exploring new ideas and bringing technology into practical learning experiences. ' +
      'This space represents my interest in innovation, experimentation, and creating useful technology projects.',
  },
  {
    id: 'career', order: 10, kind: 'career', title: 'Career Centre', subtitle: 'Resume and Contact', place: 'Career Centre (portfolio pavilion)',
    badge: 'Career Ready Explorer', token: 'Kubernetes', color: '#0b3d91', accent: '#ffd166', required: true,
    rect: { x: 26, y: 2, w: 12, h: 6 }, door: { x: 32, y: 8 },
    summary: 'Resume download, GitHub, LinkedIn and email.',
    narration:
      'Thanks for exploring my world. ' +
      'My journey combines computer science, data science, AI, web development, cloud technologies, and continuous learning. ' +
      "I'm interested in opportunities where I can apply these skills, build useful solutions, and grow as a developer. " +
      'Feel free to explore my work, view my resume, and get in touch.',
  },
];

// Missions that must be completed before the Career Centre opens (everything required except career itself).
export const CAREER_REQUIRES = MISSIONS.filter((m) => m.required && m.id !== 'career').map((m) => m.id);

// Collectible technology tokens scattered across the campus (tile coords). Names come from the skills list.
export const TOKENS = [
  { id: 't1', name: 'NumPy', x: 22, y: 24 }, { id: 't2', name: 'Pandas', x: 41, y: 24 },
  { id: 't3', name: 'PyTorch', x: 4, y: 26 }, { id: 't4', name: 'Keras', x: 59, y: 26 },
  { id: 't5', name: 'Tableau', x: 22, y: 12 }, { id: 't6', name: 'Power BI', x: 41, y: 12 },
  { id: 't7', name: 'Node.js', x: 4, y: 14 }, { id: 't8', name: 'Django', x: 59, y: 14 },
  { id: 't9', name: 'Angular', x: 29, y: 30 }, { id: 't10', name: 'C++', x: 36, y: 28 },
  { id: 't11', name: 'MATLAB', x: 4, y: 40 }, { id: 't12', name: 'LangGraph', x: 58, y: 40 },
];

// NPC students strolling the campus (waypoints in tiles)
export const NPC_ROUTES = [
  [[20, 27], [28, 27], [28, 24], [20, 24]],
  [[36, 27], [44, 27], [44, 24], [36, 24]],
  [[20, 13], [29, 13], [29, 10], [20, 10]],
  [[35, 13], [44, 13], [44, 10], [35, 10]],
  [[29, 32], [29, 26], [34, 26], [34, 32]],
  [[4, 20], [4, 33], [20, 33], [20, 20]],
];

export const CONTROLS = [
  ['W A S D / Arrow keys', 'Move'],
  ['Shift', 'Run'],
  ['E / Enter', 'Interact with a nearby building'],
  ['Space', 'Pause or resume narration'],
  ['M', 'Toggle minimap'],
  ['J', 'Mission journal'],
  ['Esc', 'Pause or close panel'],
];
