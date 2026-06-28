import PublicationType from '../models/PublicationType.js';
import License from '../models/License.js';

export const seedPublicationTypes = async () => {
  try {
    const count = await PublicationType.countDocuments();
    if (count > 0) {
      console.log('ℹ️ Publication types already seeded.');
      return;
    }

    console.log('🌱 Seeding default Publication Types...');

    const defaultTypes = [
      {
        name: 'Article',
        slug: 'article',
        description: 'Journal article, peer-reviewed paper, or review.',
        category: 'published-research',
        specificFields: [
          { name: 'journalName', label: 'Journal Name', type: 'text', required: true, placeholder: 'e.g. Nature Machine Intelligence' },
          { name: 'issn', label: 'ISSN', type: 'text', required: false, placeholder: 'e.g. 2522-5839' },
          { name: 'publisher', label: 'Publisher', type: 'text', required: false, placeholder: 'e.g. Springer Nature' },
          { name: 'volume', label: 'Volume', type: 'text', required: false, placeholder: 'e.g. 14' },
          { name: 'issue', label: 'Issue', type: 'text', required: false, placeholder: 'e.g. 3' },
          { name: 'pages', label: 'Pages', type: 'text', required: false, placeholder: 'e.g. 245-258' },
          { name: 'impactFactor', label: 'Impact Factor', type: 'number', required: false, placeholder: 'e.g. 15.4' },
          { name: 'quartile', label: 'Quartile', type: 'select', required: false, options: ['Q1', 'Q2', 'Q3', 'Q4'] },
          { name: 'indexedIn', label: 'Indexed In', type: 'text', required: false, placeholder: 'e.g. Scopus, Web of Science' },
          { name: 'peerReviewed', label: 'Peer Reviewed', type: 'boolean', required: false },
          { name: 'acceptanceDate', label: 'Acceptance Date', type: 'date', required: false }
        ]
      },
      {
        name: 'Book',
        slug: 'book',
        description: 'A whole published monograph, textbook, or reference book.',
        category: 'published-research',
        specificFields: [
          { name: 'publisher', label: 'Publisher', type: 'text', required: true, placeholder: 'e.g. O\'Reilly Media' },
          { name: 'isbn', label: 'ISBN', type: 'text', required: false, placeholder: 'e.g. 978-3-16-148410-0' },
          { name: 'edition', label: 'Edition', type: 'text', required: false, placeholder: 'e.g. 2nd Edition' },
          { name: 'totalPages', label: 'Total Pages', type: 'number', required: false, placeholder: 'e.g. 450' }
        ]
      },
      {
        name: 'Book Chapter',
        slug: 'book-chapter',
        description: 'A chapter within a larger edited volume or book.',
        category: 'published-research',
        specificFields: [
          { name: 'bookTitle', label: 'Book Title', type: 'text', required: true, placeholder: 'e.g. Advances in Deep Learning' },
          { name: 'chapterNumber', label: 'Chapter Number', type: 'text', required: false, placeholder: 'e.g. Chapter 4' },
          { name: 'editors', label: 'Editors', type: 'text', required: false, placeholder: 'e.g. Jane Doe, John Smith' },
          { name: 'isbn', label: 'ISBN', type: 'text', required: false, placeholder: 'e.g. 978-1-4919-6229-9' }
        ]
      },
      {
        name: 'Conference Paper',
        slug: 'conference-paper',
        description: 'Paper published in conference proceedings.',
        category: 'published-research',
        specificFields: [
          { name: 'conferenceName', label: 'Conference Name', type: 'text', required: true, placeholder: 'e.g. NeurIPS 2026' },
          { name: 'conferenceLocation', label: 'Conference Location', type: 'text', required: false, placeholder: 'e.g. Vancouver, Canada' },
          { name: 'conferenceDate', label: 'Conference Date', type: 'date', required: false },
          { name: 'proceedings', label: 'Proceedings Name', type: 'text', required: false, placeholder: 'e.g. Proceedings of Machine Learning Research' },
          { name: 'sessionName', label: 'Session Name', type: 'text', required: false, placeholder: 'e.g. Reinforcement Learning' },
          { name: 'paperNumber', label: 'Paper/Abstract Number', type: 'text', required: false, placeholder: 'e.g. 1024' },
          { name: 'presentationType', label: 'Presentation Type', type: 'select', required: false, options: ['Oral', 'Poster', 'Keynote', 'Workshop'] }
        ]
      },
      {
        name: 'Thesis',
        slug: 'thesis',
        description: 'Master\'s thesis or doctoral dissertation.',
        category: 'published-research',
        specificFields: [
          { name: 'university', label: 'University', type: 'text', required: true, placeholder: 'e.g. Stanford University' },
          { name: 'degree', label: 'Degree', type: 'text', required: true, placeholder: 'e.g. PhD in Computer Science' },
          { name: 'department', label: 'Department', type: 'text', required: false, placeholder: 'e.g. Department of Computer Science' },
          { name: 'supervisor', label: 'Supervisor', type: 'text', required: false, placeholder: 'e.g. Prof. Andrew Ng' },
          { name: 'submissionDate', label: 'Submission Date', type: 'date', required: false },
          { name: 'defenseDate', label: 'Defense Date', type: 'date', required: false }
        ]
      },
      {
        name: 'Patent',
        slug: 'patent',
        description: 'Registered patent or patent application.',
        category: 'published-research',
        specificFields: [
          { name: 'patentNumber', label: 'Patent Number', type: 'text', required: true, placeholder: 'e.g. US10123456B2' },
          { name: 'patentOffice', label: 'Patent Office', type: 'text', required: true, placeholder: 'e.g. USPTO, EPO' },
          { name: 'applicationNumber', label: 'Application Number', type: 'text', required: false, placeholder: 'e.g. US15/123456' },
          { name: 'inventors', label: 'Inventors', type: 'text', required: false, placeholder: 'e.g. Sarah Jenkins, John Doe' },
          { name: 'filingDate', label: 'Filing Date', type: 'date', required: false },
          { name: 'grantDate', label: 'Grant Date', type: 'date', required: false },
          { name: 'patentStatus', label: 'Patent Status', type: 'select', required: false, options: ['Pending', 'Granted', 'Expired', 'Abandoned'] }
        ]
      },
      {
        name: 'Preprint',
        slug: 'preprint',
        description: 'Draft or paper before formal peer review and journal publication.',
        category: 'preprint',
        specificFields: [
          { name: 'repositoryName', label: 'Repository Name', type: 'text', required: false, placeholder: 'e.g. arXiv, bioRxiv, SSRN' },
          { name: 'preprintVersion', label: 'Preprint Version', type: 'text', required: false, placeholder: 'e.g. v2' }
        ]
      },
      {
        name: 'Presentation',
        slug: 'presentation',
        description: 'Slides, lectures, or talk presentation materials.',
        category: 'presentation',
        specificFields: [
          { name: 'conferenceName', label: 'Event / Conference Name', type: 'text', required: false, placeholder: 'e.g. SciPy 2026' },
          { name: 'speaker', label: 'Speaker(s)', type: 'text', required: false, placeholder: 'e.g. Dr. Sarah Jenkins' },
          { name: 'presentationDate', label: 'Presentation Date', type: 'date', required: false },
          { name: 'slidesUrl', label: 'Slides URL', type: 'text', required: false, placeholder: 'e.g. https://speakerdeck.com/user/slides' },
          { name: 'videoUrl', label: 'Video Recording URL', type: 'text', required: false, placeholder: 'e.g. https://youtube.com/watch?v=...' }
        ]
      },
      {
        name: 'Poster',
        slug: 'poster',
        description: 'Conference poster displaying research summary.',
        category: 'poster',
        specificFields: [
          { name: 'conferenceName', label: 'Conference Name', type: 'text', required: false, placeholder: 'e.g. ICML 2026' },
          { name: 'posterSession', label: 'Poster Session Name/Number', type: 'text', required: false, placeholder: 'e.g. Session A - Deep Learning' },
          { name: 'presenter', label: 'Presenter', type: 'text', required: false, placeholder: 'e.g. Sarah Jenkins' }
        ]
      },
      {
        name: 'Data',
        slug: 'data',
        description: 'Datasets, tables, spreadsheets, structural coordinates, or genomes.',
        category: 'data',
        specificFields: [
          { name: 'datasetName', label: 'Dataset Name', type: 'text', required: true, placeholder: 'e.g. Stanford Chest X-Ray Dataset' },
          { name: 'datasetVersion', label: 'Dataset Version', type: 'text', required: false, placeholder: 'e.g. v1.0.2' },
          { name: 'datasetSize', label: 'Dataset Size', type: 'text', required: false, placeholder: 'e.g. 4.2 GB' },
          { name: 'numberOfFiles', label: 'Number of Files', type: 'number', required: false, placeholder: 'e.g. 15000' }
        ]
      },
      {
        name: 'Raw Data',
        slug: 'raw-data',
        description: 'Unprocessed readings, instruments output, or clinical records.',
        category: 'data',
        specificFields: [
          { name: 'dataCollectionMethod', label: 'Data Collection Method', type: 'text', required: false, placeholder: 'e.g. Automated telemetry logs' },
          { name: 'instrument', label: 'Instrument / Device Name', type: 'text', required: false, placeholder: 'e.g. Illumina NovaSeq 6000' },
          { name: 'dataFormat', label: 'Data Format', type: 'text', required: false, placeholder: 'e.g. FASTQ, CSV, DICOM' },
          { name: 'sampleSize', label: 'Sample Size', type: 'number', required: false, placeholder: 'e.g. 250' }
        ]
      },
      {
        name: 'Code',
        slug: 'code',
        description: 'Software packages, scripts, notebooks, or source code.',
        category: 'methods-proposal-code',
        specificFields: [
          { name: 'githubRepository', label: 'GitHub Repository', type: 'text', required: true, placeholder: 'e.g. https://github.com/user/project' },
          { name: 'gitlabRepository', label: 'GitLab Repository', type: 'text', required: false, placeholder: 'e.g. https://gitlab.com/user/project' },
          { name: 'bitbucketRepository', label: 'Bitbucket Repository', type: 'text', required: false, placeholder: 'e.g. https://bitbucket.org/user/project' },
          { name: 'programmingLanguage', label: 'Programming Language', type: 'text', required: false, placeholder: 'e.g. Python, Rust, C++' },
          { name: 'framework', label: 'Framework / Library', type: 'text', required: false, placeholder: 'e.g. PyTorch, React' },
          { name: 'documentationUrl', label: 'Documentation URL', type: 'text', required: false, placeholder: 'e.g. https://project.readthedocs.io' },
          { name: 'installationGuide', label: 'Installation Guide Summary', type: 'text', required: false, placeholder: 'e.g. pip install -r requirements.txt' }
        ]
      },
      {
        name: 'Technical Report',
        slug: 'technical-report',
        description: 'Institutional or agency technical report or white paper.',
        category: 'published-research',
        specificFields: [
          { name: 'organization', label: 'Issuing Organization', type: 'text', required: true, placeholder: 'e.g. Stanford Computer Science Dept' },
          { name: 'reportNumber', label: 'Report Number', type: 'text', required: false, placeholder: 'e.g. TR-2026-08' },
          { name: 'sponsor', label: 'Sponsoring Agency', type: 'text', required: false, placeholder: 'e.g. National Science Foundation' }
        ]
      },
      {
        name: 'Research Proposal',
        slug: 'research-proposal',
        description: 'Grant application, research plan, or thesis proposal.',
        category: 'methods-proposal-code',
        specificFields: [
          { name: 'fundingAgency', label: 'Target Funding Agency', type: 'text', required: true, placeholder: 'e.g. NIH, Horizon Europe' },
          { name: 'budget', label: 'Proposed Budget', type: 'text', required: false, placeholder: 'e.g. $250,000' },
          { name: 'duration', label: 'Proposed Duration', type: 'text', required: false, placeholder: 'e.g. 3 Years' },
          { name: 'objectives', label: 'Specific Objectives', type: 'text', required: false, placeholder: 'Summarize the core objectives...' },
          { name: 'expectedOutcome', label: 'Expected Outcomes', type: 'text', required: false, placeholder: 'What are the expected results?' }
        ]
      },
      {
        name: 'Method',
        slug: 'method',
        description: 'Experimental protocol, methodology, or workflow.',
        category: 'methods-proposal-code',
        specificFields: [
          { name: 'methodName', label: 'Method Name', type: 'text', required: true, placeholder: 'e.g. Single-cell RNA extraction' },
          { name: 'equipment', label: 'Equipment / Reagents', type: 'text', required: false, placeholder: 'e.g. Centrifuge, PCR plates' },
          { name: 'procedure', label: 'Procedure Summary', type: 'text', required: false, placeholder: 'Outline the steps...' },
          { name: 'softwareUsed', label: 'Software Used', type: 'text', required: false, placeholder: 'e.g. ImageJ, CellProfiler' }
        ]
      },
      {
        name: 'Experiment Findings',
        slug: 'experiment-findings',
        description: 'Interim results, lab notes, or observations.',
        category: 'methods-proposal-code',
        specificFields: [
          { name: 'experimentName', label: 'Experiment Name', type: 'text', required: true, placeholder: 'e.g. Temperature resistance test' },
          { name: 'materials', label: 'Materials Used', type: 'text', required: false, placeholder: 'e.g. Graphene oxide sheets' },
          { name: 'procedure', label: 'Procedure', type: 'text', required: false, placeholder: 'Describe the experiment setup...' },
          { name: 'results', label: 'Results & Findings', type: 'text', required: false, placeholder: 'State the observations...' }
        ]
      },
      {
        name: 'Negative Results',
        slug: 'negative-results',
        description: 'Failed experiments, disproven hypotheses, or lessons learned.',
        category: 'methods-proposal-code',
        specificFields: [
          { name: 'hypothesis', label: 'Original Hypothesis', type: 'text', required: true, placeholder: 'e.g. Drug X inhibits protein Y' },
          { name: 'failedMethod', label: 'Method Employed', type: 'text', required: false, placeholder: 'What protocol was tested?' },
          { name: 'observation', label: 'Observations / Readings', type: 'text', required: false, placeholder: 'What actually happened?' },
          { name: 'lessonsLearned', label: 'Lessons Learned', type: 'text', required: false, placeholder: 'Key takeaways and recommendations...' }
        ]
      },
      {
        name: 'Cover Page',
        slug: 'cover-page',
        description: 'Cover sheet, title page, or poster template.',
        category: 'published-research',
        specificFields: []
      }
    ];

    await PublicationType.insertMany(defaultTypes);
    console.log(`✅ Seeded ${defaultTypes.length} Publication Types.`);
  } catch (err) {
    console.error(`❌ Failed to seed Publication Types: ${err.message}`);
  }
};

export const seedLicenses = async () => {
  try {
    const count = await License.countDocuments();
    if (count > 0) {
      console.log('ℹ️ Licenses already seeded.');
      return;
    }

    console.log('🌱 Seeding default Licenses...');

    const defaultLicenses = [
      { name: 'Creative Commons Attribution 4.0 International', code: 'CC-BY-4.0', url: 'https://creativecommons.org/licenses/by/4.0/', description: 'Allows sharing and adapting as long as credit is given.' },
      { name: 'Creative Commons Attribution-NonCommercial 4.0 International', code: 'CC-BY-NC-4.0', url: 'https://creativecommons.org/licenses/by-nc/4.0/', description: 'Allows sharing and adapting for non-commercial purposes only.' },
      { name: 'Creative Commons Attribution-NoDerivatives 4.0 International', code: 'CC-BY-ND-4.0', url: 'https://creativecommons.org/licenses/by-nd/4.0/', description: 'Allows sharing in original form, no derivatives.' },
      { name: 'Creative Commons Zero v1.0 Universal (Public Domain)', code: 'CC0-1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', description: 'Waives all copyright, dedicating the work to the public domain.' },
      { name: 'MIT License', code: 'MIT', url: 'https://opensource.org/licenses/MIT', description: 'A short, permissive software license.' },
      { name: 'Apache License 2.0', code: 'Apache-2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0', description: 'Permissive software license with patent protection.' },
      { name: 'GNU General Public License v3.0', code: 'GPL-3.0', url: 'https://www.gnu.org/licenses/gpl-3.0.html', description: 'Copyleft software license requiring source code disclosure.' }
    ];

    await License.insertMany(defaultLicenses);
    console.log(`✅ Seeded ${defaultLicenses.length} Licenses.`);
  } catch (err) {
    console.error(`❌ Failed to seed Licenses: ${err.message}`);
  }
};
