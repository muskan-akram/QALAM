-- QALAM Extended Book Seed — 100 Books with real data
-- Run this after the schema is applied

INSERT INTO books (title, author, isbn, publisher, published_year, genre, tags, description, total_copies, available_copies, location) VALUES

-- Technology
('The Pragmatic Programmer', 'David Thomas, Andrew Hunt', '978-0135957059', 'Addison-Wesley', 2019, 'Technology', ARRAY['programming','software engineering','best practices'], 'A guide for programmers who want to get better at their craft.', 3, 3, 'A-01'),
('Clean Code', 'Robert C. Martin', '978-0132350884', 'Prentice Hall', 2008, 'Technology', ARRAY['programming','clean code','software design'], 'A handbook of agile software craftsmanship.', 2, 2, 'A-02'),
('Python Crash Course', 'Eric Matthes', '978-1718502703', 'No Starch Press', 2023, 'Technology', ARRAY['python','programming','beginner'], 'A hands-on, project-based introduction to Python.', 4, 4, 'A-03'),
('Deep Learning', 'Ian Goodfellow', '978-0262035613', 'MIT Press', 2016, 'Technology', ARRAY['AI','machine learning','neural networks'], 'The definitive textbook on deep learning.', 2, 2, 'A-04'),
('Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'MIT Press', 2009, 'Technology', ARRAY['algorithms','computer science','data structures'], 'The most widely used algorithms textbook worldwide.', 3, 3, 'A-05'),
('Design Patterns', 'Gang of Four', '978-0201633610', 'Addison-Wesley', 1994, 'Technology', ARRAY['design patterns','software architecture','OOP'], 'The classic book on software design patterns.', 2, 2, 'A-06'),
('The Art of Computer Programming', 'Donald E. Knuth', '978-0201896831', 'Addison-Wesley', 2011, 'Technology', ARRAY['algorithms','computer science','mathematics'], 'Knuths comprehensive multi-volume work on algorithms.', 1, 1, 'A-07'),
('JavaScript: The Good Parts', 'Douglas Crockford', '978-0596517748', 'O''Reilly', 2008, 'Technology', ARRAY['javascript','web development','programming'], 'Unearthing the excellence in JavaScript.', 3, 3, 'A-08'),
('Refactoring', 'Martin Fowler', '978-0134757599', 'Addison-Wesley', 2018, 'Technology', ARRAY['refactoring','programming','software design'], 'Improving the design of existing code.', 2, 2, 'A-09'),
('Structure and Interpretation of Computer Programs', 'Harold Abelson', '978-0262510875', 'MIT Press', 1996, 'Technology', ARRAY['computer science','programming','LISP'], 'The wizard book of computer science education.', 2, 2, 'A-10'),
('The Mythical Man-Month', 'Frederick P. Brooks Jr.', '978-0201835953', 'Addison-Wesley', 1995, 'Technology', ARRAY['software engineering','project management','classics'], 'Essays on software engineering and project management.', 2, 2, 'A-11'),
('Code Complete', 'Steve McConnell', '978-0735619678', 'Microsoft Press', 2004, 'Technology', ARRAY['software construction','programming','best practices'], 'A practical handbook of software construction.', 2, 2, 'A-12'),
('Head First Design Patterns', 'Eric Freeman', '978-0596007126', 'O''Reilly', 2004, 'Technology', ARRAY['design patterns','Java','OOP'], 'A brain-friendly guide to design patterns.', 3, 3, 'A-13'),
('You Don''t Know JS', 'Kyle Simpson', '978-1491904244', 'O''Reilly', 2015, 'Technology', ARRAY['javascript','programming','web'], 'A deep dive into JavaScript mechanisms.', 4, 4, 'A-14'),
('Learning Python', 'Mark Lutz', '978-1449355739', 'O''Reilly', 2013, 'Technology', ARRAY['python','programming'], 'Comprehensive Python programming guide.', 3, 3, 'A-15'),

-- Science Fiction
('Dune', 'Frank Herbert', '978-0441013593', 'Ace Books', 1965, 'Science Fiction', ARRAY['classic','space opera','philosophy'], 'The story of Paul Atreides on the desert planet Arrakis.', 4, 4, 'B-01'),
('Foundation', 'Isaac Asimov', '978-0553293357', 'Bantam Books', 1951, 'Science Fiction', ARRAY['classic','galactic empire','mathematics'], 'The first volume of Asimovs Foundation series.', 3, 3, 'B-02'),
('1984', 'George Orwell', '978-0451524935', 'Signet Classic', 1949, 'Science Fiction', ARRAY['dystopia','politics','classic'], 'A dystopian novel about totalitarian surveillance.', 5, 5, 'B-03'),
('Brave New World', 'Aldous Huxley', '978-0060850524', 'Harper Perennial', 1932, 'Science Fiction', ARRAY['dystopia','classic','society'], 'A vision of a future world state.', 3, 3, 'B-04'),
('The Hitchhiker''s Guide to the Galaxy', 'Douglas Adams', '978-0345391803', 'Del Rey', 1979, 'Science Fiction', ARRAY['humor','space','adventure'], 'The comedy science fiction classic.', 4, 4, 'B-05'),
('Ender''s Game', 'Orson Scott Card', '978-0812550702', 'Tor Books', 1985, 'Science Fiction', ARRAY['military','youth','strategy'], 'A gifted boy trains to fight alien invaders.', 3, 3, 'B-06'),
('The Martian', 'Andy Weir', '978-0553418026', 'Crown', 2011, 'Science Fiction', ARRAY['mars','survival','humor'], 'An astronaut stranded on Mars must survive alone.', 4, 4, 'B-07'),
('Neuromancer', 'William Gibson', '978-0441569595', 'Ace Books', 1984, 'Science Fiction', ARRAY['cyberpunk','hacking','AI'], 'The defining cyberpunk novel.', 2, 2, 'B-08'),
('Snow Crash', 'Neal Stephenson', '978-0553380958', 'Bantam Spectra', 1992, 'Science Fiction', ARRAY['cyberpunk','virtual reality','linguistics'], 'Hiro Protagonist battles a virtual reality virus.', 2, 2, 'B-09'),
('The Left Hand of Darkness', 'Ursula K. Le Guin', '978-0441478125', 'Ace Books', 1969, 'Science Fiction', ARRAY['gender','anthropology','classic'], 'A diplomat visits a planet where humans have no fixed sex.', 2, 2, 'B-10'),

-- Self-Help
('Atomic Habits', 'James Clear', '978-0735211292', 'Avery', 2018, 'Self-Help', ARRAY['productivity','habits','personal development'], 'Tiny changes, remarkable results.', 5, 5, 'C-01'),
('The 7 Habits of Highly Effective People', 'Stephen R. Covey', '978-0743269513', 'Free Press', 1989, 'Self-Help', ARRAY['productivity','leadership','character'], 'Powerful lessons in personal change.', 4, 4, 'C-02'),
('Thinking, Fast and Slow', 'Daniel Kahneman', '978-0374533557', 'Farrar, Straus and Giroux', 2011, 'Self-Help', ARRAY['psychology','decision making','behavior'], 'How two systems of thought shape our judgments.', 3, 3, 'C-03'),
('The Power of Now', 'Eckhart Tolle', '978-1577314806', 'New World Library', 1997, 'Self-Help', ARRAY['mindfulness','spirituality','presence'], 'A guide to spiritual enlightenment.', 3, 3, 'C-04'),
('Deep Work', 'Cal Newport', '978-1455586691', 'Grand Central', 2016, 'Self-Help', ARRAY['productivity','focus','work'], 'Rules for focused success in a distracted world.', 4, 4, 'C-05'),
('How to Win Friends and Influence People', 'Dale Carnegie', '978-0671027032', 'Pocket Books', 1936, 'Self-Help', ARRAY['relationships','communication','leadership'], 'The classic guide to success in life.', 4, 4, 'C-06'),
('Mindset', 'Carol S. Dweck', '978-0345472328', 'Ballantine Books', 2006, 'Self-Help', ARRAY['psychology','growth','education'], 'The new psychology of success.', 3, 3, 'C-07'),
('The Subtle Art of Not Giving a F*ck', 'Mark Manson', '978-0062457714', 'HarperOne', 2016, 'Self-Help', ARRAY['philosophy','happiness','perspective'], 'A counterintuitive approach to living a good life.', 4, 4, 'C-08'),
('Grit', 'Angela Duckworth', '978-1501111105', 'Scribner', 2016, 'Self-Help', ARRAY['perseverance','success','psychology'], 'The power of passion and perseverance.', 3, 3, 'C-09'),
('The 4-Hour Workweek', 'Timothy Ferriss', '978-0307465351', 'Crown', 2007, 'Self-Help', ARRAY['lifestyle design','productivity','entrepreneurship'], 'Escape the 9-5 and join the new rich.', 2, 2, 'C-10'),

-- Non-Fiction
('Sapiens', 'Yuval Noah Harari', '978-0062316097', 'Harper', 2015, 'Non-Fiction', ARRAY['history','anthropology','evolution'], 'A brief history of humankind.', 4, 4, 'D-01'),
('Homo Deus', 'Yuval Noah Harari', '978-0062464316', 'Harper', 2016, 'Non-Fiction', ARRAY['future','technology','humanity'], 'A brief history of tomorrow.', 3, 3, 'D-02'),
('21 Lessons for the 21st Century', 'Yuval Noah Harari', '978-0525512172', 'Spiegel & Grau', 2018, 'Non-Fiction', ARRAY['politics','society','future'], 'Reflections on todays most urgent issues.', 3, 3, 'D-03'),
('Educated', 'Tara Westover', '978-0399590504', 'Random House', 2018, 'Non-Fiction', ARRAY['memoir','education','family'], 'A memoir about growing up and the quest for knowledge.', 4, 4, 'D-04'),
('The Body', 'Bill Bryson', '978-0385543644', 'Doubleday', 2019, 'Non-Fiction', ARRAY['science','anatomy','biology'], 'A guide for occupants of the human body.', 3, 3, 'D-05'),
('Factfulness', 'Hans Rosling', '978-1250107817', 'Flatiron Books', 2018, 'Non-Fiction', ARRAY['data','statistics','global development'], 'Ten reasons we are wrong about the world.', 2, 2, 'D-06'),
('The Gene', 'Siddhartha Mukherjee', '978-1476733500', 'Scribner', 2016, 'Non-Fiction', ARRAY['genetics','biology','history'], 'An intimate history of the gene.', 2, 2, 'D-07'),
('Becoming', 'Michelle Obama', '978-1524763138', 'Crown', 2018, 'Non-Fiction', ARRAY['memoir','politics','inspiration'], 'Michelle Obamas intimate memoir.', 3, 3, 'D-08'),
('The Innovators', 'Walter Isaacson', '978-1476708706', 'Simon & Schuster', 2014, 'Non-Fiction', ARRAY['technology','history','computers'], 'How a group of hackers and geniuses created the digital revolution.', 2, 2, 'D-09'),
('Outliers', 'Malcolm Gladwell', '978-0316017930', 'Little Brown', 2008, 'Non-Fiction', ARRAY['success','psychology','society'], 'The story of success.', 3, 3, 'D-10'),

-- Fiction
('To Kill a Mockingbird', 'Harper Lee', '978-0446310789', 'Grand Central', 1960, 'Fiction', ARRAY['classic','justice','americana'], 'A novel about racial injustice and moral growth.', 4, 4, 'E-01'),
('Pride and Prejudice', 'Jane Austen', '978-0141439518', 'Penguin Classics', 1813, 'Fiction', ARRAY['classic','romance','society'], 'Austen''s masterpiece of wit and social commentary.', 4, 4, 'E-02'),
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Scribner', 1925, 'Fiction', ARRAY['classic','american dream','20th century'], 'The story of Jay Gatsby and the Jazz Age.', 3, 3, 'E-03'),
('One Hundred Years of Solitude', 'Gabriel García Márquez', '978-0060883287', 'Harper Perennial', 1967, 'Fiction', ARRAY['magical realism','latin america','classic'], 'The epic story of the Buendía family.', 2, 2, 'E-04'),
('The Alchemist', 'Paulo Coelho', '978-0062315007', 'HarperOne', 1988, 'Fiction', ARRAY['philosophy','journey','destiny'], 'A fable about following your dream.', 5, 5, 'E-05'),
('Crime and Punishment', 'Fyodor Dostoevsky', '978-0486415871', 'Dover', 1866, 'Fiction', ARRAY['classic','russian','psychology'], 'A young student commits murder and wrestles with guilt.', 2, 2, 'E-06'),
('Anna Karenina', 'Leo Tolstoy', '978-0143035008', 'Penguin Classics', 1877, 'Fiction', ARRAY['classic','russian','romance'], 'Tolstoy''s epic novel of love and society in Russia.', 2, 2, 'E-07'),
('The Kite Runner', 'Khaled Hosseini', '978-1594631931', 'Riverhead Books', 2003, 'Fiction', ARRAY['afghanistan','friendship','redemption'], 'A powerful story of friendship and redemption.', 4, 4, 'E-08'),
('A Thousand Splendid Suns', 'Khaled Hosseini', '978-1594489501', 'Riverhead Books', 2007, 'Fiction', ARRAY['afghanistan','women','war'], 'An unforgettable portrait of Afghan women.', 3, 3, 'E-09'),
('Midnight''s Children', 'Salman Rushdie', '978-0812976533', 'Random House', 1981, 'Fiction', ARRAY['india','magic realism','partition'], 'Booker Prize winner: a child born at India''s independence.', 2, 2, 'E-10'),

-- History
('A Short History of Nearly Everything', 'Bill Bryson', '978-0767908184', 'Broadway Books', 2003, 'History', ARRAY['science','universe','history'], 'The story of science and the universe in accessible terms.', 3, 3, 'F-01'),
('Guns, Germs, and Steel', 'Jared Diamond', '978-0393317558', 'Norton', 1997, 'History', ARRAY['anthropology','civilization','geography'], 'The fates of human societies.', 3, 3, 'F-02'),
('The Rise and Fall of the Third Reich', 'William L. Shirer', '978-1451651683', 'Simon & Schuster', 1960, 'History', ARRAY['world war 2','nazi germany','history'], 'The definitive account of Nazi Germany.', 2, 2, 'F-03'),
('Team of Rivals', 'Doris Kearns Goodwin', '978-0684824901', 'Simon & Schuster', 2005, 'History', ARRAY['lincoln','american history','politics'], 'The political genius of Abraham Lincoln.', 2, 2, 'F-04'),
('The Silk Roads', 'Peter Frankopan', '978-1101912379', 'Knopf', 2016, 'History', ARRAY['world history','trade','civilization'], 'A new history of the world through the Silk Roads.', 3, 3, 'F-05'),
('SPQR: A History of Ancient Rome', 'Mary Beard', '978-0871404237', 'Liveright', 2015, 'History', ARRAY['rome','ancient history','classics'], 'A bold, irresistible account of ancient Rome.', 2, 2, 'F-06'),
('The Crusades', 'Thomas Asbridge', '978-0061862649', 'Ecco', 2010, 'History', ARRAY['middle ages','crusades','religion'], 'A comprehensive history of the Crusades.', 2, 2, 'F-07'),
('The Ottoman Empire', 'Lord Kinross', '978-0688036003', 'Morrow Quill', 1977, 'History', ARRAY['ottoman','turkey','islam'], 'The rise and fall of the Ottoman Empire.', 2, 2, 'F-08'),

-- Philosophy
('Meditations', 'Marcus Aurelius', '978-0812968255', 'Modern Library', 161, 'Philosophy', ARRAY['stoicism','leadership','wisdom'], 'Personal writings of the Roman Emperor on Stoic philosophy.', 4, 4, 'G-01'),
('The Republic', 'Plato', '978-0872201361', 'Hackett', -380, 'Philosophy', ARRAY['justice','politics','ideal state'], 'Plato''s classic dialogue on justice and the ideal state.', 3, 3, 'G-02'),
('Nicomachean Ethics', 'Aristotle', '978-0872204645', 'Hackett', -350, 'Philosophy', ARRAY['ethics','virtue','happiness'], 'Aristotle''s philosophical inquiry into virtue and happiness.', 2, 2, 'G-03'),
('Beyond Good and Evil', 'Friedrich Nietzsche', '978-0679724650', 'Vintage', 1886, 'Philosophy', ARRAY['nietzsche','morality','power'], 'A critique of traditional morality.', 2, 2, 'G-04'),
('Being and Time', 'Martin Heidegger', '978-0061575594', 'Harper Perennial', 1927, 'Philosophy', ARRAY['existentialism','ontology','time'], 'Heidegger''s magnum opus on the nature of being.', 1, 1, 'G-05'),
('The Critique of Pure Reason', 'Immanuel Kant', '978-0521657297', 'Cambridge', 1781, 'Philosophy', ARRAY['knowledge','reason','metaphysics'], 'Kant''s monumental work on the limits of human reason.', 1, 1, 'G-06'),

-- Psychology
('Influence', 'Robert B. Cialdini', '978-0061241895', 'HarperBusiness', 2006, 'Psychology', ARRAY['persuasion','behavior','marketing'], 'The psychology of persuasion.', 4, 4, 'H-01'),
('The Psychology of Money', 'Morgan Housel', '978-0857197689', 'Harriman House', 2020, 'Psychology', ARRAY['finance','behavior','wealth'], 'Timeless lessons on wealth, greed, and happiness.', 5, 5, 'H-02'),
('Man''s Search for Meaning', 'Viktor E. Frankl', '978-0807014295', 'Beacon Press', 1946, 'Psychology', ARRAY['existentialism','holocaust','purpose'], 'Frankl''s account of life in Nazi death camps.', 4, 4, 'H-03'),
('Flow', 'Mihaly Csikszentmihalyi', '978-0061339202', 'Harper Perennial', 1990, 'Psychology', ARRAY['happiness','creativity','optimal experience'], 'The psychology of optimal experience.', 3, 3, 'H-04'),
('The Body Keeps the Score', 'Bessel van der Kolk', '978-0143127741', 'Penguin', 2014, 'Psychology', ARRAY['trauma','healing','neuroscience'], 'Brain, mind, and body in the healing of trauma.', 3, 3, 'H-05'),

-- Business
('Good to Great', 'Jim Collins', '978-0066620992', 'HarperBusiness', 2001, 'Business', ARRAY['leadership','management','companies'], 'Why some companies make the leap and others don''t.', 3, 3, 'I-01'),
('Zero to One', 'Peter Thiel', '978-0804139021', 'Crown Business', 2014, 'Business', ARRAY['startups','entrepreneurship','innovation'], 'Notes on startups, or how to build the future.', 4, 4, 'I-02'),
('The Lean Startup', 'Eric Ries', '978-0307887894', 'Crown Business', 2011, 'Business', ARRAY['entrepreneurship','agile','startups'], 'How today''s entrepreneurs use continuous innovation.', 3, 3, 'I-03'),
('Thinking in Bets', 'Annie Duke', '978-0735216358', 'Portfolio', 2018, 'Business', ARRAY['decision making','probability','poker'], 'Making smarter decisions when you don''t have all the facts.', 2, 2, 'I-04'),
('Never Split the Difference', 'Chris Voss', '978-0062407801', 'HarperBusiness', 2016, 'Business', ARRAY['negotiation','communication','FBI'], 'Negotiating as if your life depended on it.', 4, 4, 'I-05'),

-- Science
('A Brief History of Time', 'Stephen Hawking', '978-0553380163', 'Bantam', 1988, 'Science', ARRAY['cosmology','physics','universe'], 'From the Big Bang to black holes.', 4, 4, 'J-01'),
('The Selfish Gene', 'Richard Dawkins', '978-0198788607', 'Oxford', 1976, 'Science', ARRAY['evolution','genetics','biology'], 'How natural selection works through the gene.', 3, 3, 'J-02'),
('Cosmos', 'Carl Sagan', '978-0345331359', 'Ballantine', 1980, 'Science', ARRAY['astronomy','universe','humanity'], 'A personal voyage through space and time.', 3, 3, 'J-03'),
('The Origin of Species', 'Charles Darwin', '978-0140432053', 'Penguin Classics', 1859, 'Science', ARRAY['evolution','biology','classic'], 'Darwin''s landmark work on natural selection.', 2, 2, 'J-04'),
('Surely You''re Joking, Mr. Feynman!', 'Richard P. Feynman', '978-0393316049', 'Norton', 1985, 'Science', ARRAY['physics','memoir','humor'], 'Adventures of a curious character by Nobel laureate Feynman.', 3, 3, 'J-05')

ON CONFLICT DO NOTHING;
