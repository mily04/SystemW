import React, { useState } from 'react';
import { Settings, Layers, Users, FileBarChart, MessageSquareText, ArrowLeftRight } from 'lucide-react';
import { CourseInfo, Objective, Assessment, Mapping, Student, GradReq, SurveyItem, SubjectiveEval, ContinuousImprovement, IndirectEvalSettings } from './types';
import SetupTab from './components/SetupTab';
import MappingTab from './components/MappingTab';
import DataEntryTab from './components/DataEntryTab';
import IndirectEvalTab from './components/IndirectEvalTab';
import ReportTab from './components/ReportTab';

// Initial mock data based on the PDF
const initialCourseInfo: CourseInfo = {
  courseName: '单片机原理及接口技术',
  term: '2024 年（秋）',
  targetStudents: '自动化 221-225',
  teacher: '郭栋'
};

const initialObjectives: Objective[] = [
  { id: 'obj1', name: 'Obj 1', description: '能够运用单片机及接口知识，进行单片机系统方案设计的分析、比较和综合。' },
  { id: 'obj2', name: 'Obj 2', description: '能够进行单片机系统常用接口的设计及其应用程序的编写。' },
  { id: 'obj3', name: 'Obj 3', description: '能够根据目标需求，设计与开发单片机应用系统。' },
];

const initialAssessments: Assessment[] = [
  { id: 'a1', name: '期末考试' },
  { id: 'a2', name: 'MOOC' },
  { id: 'a3', name: '技能测试' },
  { id: 'a4', name: '实验' },
];

const initialMappings: Mapping[] = [
  { objectiveId: 'obj1', assessmentId: 'a1', weight: 0.9, targetScore: 61 },
  { objectiveId: 'obj1', assessmentId: 'a2', weight: 0.1, targetScore: 100 },
  { objectiveId: 'obj2', assessmentId: 'a1', weight: 0.9, targetScore: 39 },
  { objectiveId: 'obj2', assessmentId: 'a4', weight: 0.1, targetScore: 60 },
  { objectiveId: 'obj3', assessmentId: 'a3', weight: 0.9, targetScore: 100 },
  { objectiveId: 'obj3', assessmentId: 'a4', weight: 0.1, targetScore: 40 },
];

const initialStudents: Student[] = [
  {
    id: 's1',
    studentId: '210302018',
    name: '郑宇琨',
    scores: {
      'obj1_a1': 35,
      'obj1_a2': 83,
      'obj2_a1': 18,
      'obj2_a4': 47.2,
      'obj3_a3': 98,
      'obj3_a4': 34
    }
  },
  {
    id: 's2',
    studentId: '220301020',
    name: '董星辰',
    scores: {
      'obj1_a1': 46,
      'obj1_a2': 83,
      'obj2_a1': 12,
      'obj2_a4': 52.8,
      'obj3_a3': 88,
      'obj3_a4': 34.8
    }
  },
  {
    id: 's3',
    studentId: '220302001',
    name: '邢诗浩',
    scores: {
      'obj1_a1': 48,
      'obj1_a2': 89,
      'obj2_a1': 37,
      'obj2_a4': 51.8,
      'obj3_a3': 88,
      'obj3_a4': 36.4
    }
  }
];

const initialGradReqs: GradReq[] = [
  { objectiveId: 'obj1', indicator: 'Req 1.3', weight: 0.3 },
  { objectiveId: 'obj2', indicator: 'Req 2.3', weight: 0.3 },
  { objectiveId: 'obj3', indicator: 'Req 3.1', weight: 0.4 },
];

const initialSurveyItems: SurveyItem[] = [
  { id: 'item1', objectiveId: 'obj1', description: '能够理解和掌握 51 单片机的片内硬件结构、硬件资源（中断、定时器/计数器、串行口等）的工作原理，单片机 C 语言基础知识、常用接口的工作原理；并能够根据需求进行单片机选型以及系统方案设计。', weight: 0.5, percentages: { excellent: 24.7, good: 47.9, medium: 22.7, pass: 4 } },
  { id: 'item2', objectiveId: 'obj1', description: '能够通过网络等手段查阅单片机相关的资料及知识并用于设计中。', weight: 0.5, percentages: { excellent: 26.7, good: 45.3, medium: 22, pass: 5.3 } },
  { id: 'item3', objectiveId: 'obj2', description: '能够理解和掌握单片机系统常用接口（键盘、显示、串行通信、D/A、A/D）的设计原理、设计方法，并能应用于单片机应用系统设计中。', weight: 0.5, percentages: { excellent: 24.7, good: 44, medium: 25.3, pass: 5.3 } },
  { id: 'item4', objectiveId: 'obj2', description: '能够进行单片机系统常用接口（键盘、显示、串行通信、D/A、A/D）的功能模块程序设计。', weight: 0.5, percentages: { excellent: 22, good: 48.6, medium: 24, pass: 4.7 } },
  { id: 'item5', objectiveId: 'obj3', description: '能够根据目标需求，进行单片机应用系统设计的分析。', weight: 0.5, percentages: { excellent: 20, good: 50.6, medium: 22.7, pass: 6 } },
  { id: 'item6', objectiveId: 'obj3', description: '能够根据目标需求进行单片机应用系统设计，包括接口设计及应用程序设计。', weight: 0.5, percentages: { excellent: 17.3, good: 52, medium: 22.7, pass: 7.3 } },
];

const initialSubjectiveEvals: SubjectiveEval[] = [
  { objectiveId: 'obj1', qualitativeEval: '结课座谈会 150 人中有 16 人表示单片机的内部寄存器功能繁多，对于寄存器特定作用和控制位等掌握不熟练，任课教师解析了对应的知识点，并强调学生平时要详细阅读单片机技术手册，了解硬件资源和接口功能，而熟练掌握对应的知识点需要大量的实践练习和经验积累，建议学生根据课下多阅读、多练习、多总结。', analysis: '本课程目标由期末考试、MOOC 构成，从期末考试达成度 0.82 可以看出，学生掌握了关于课程目标 1 相关的内容，期末考试中反映的欠缺之处是按照指定功能进行 C51 程序代码的编写、串行口及并行扩展概念理解。MOOC 环节的达成度为 0.83，表明学生能够运用 MOOC 平台进行学习、完成关于课程目标的练习及作业。' },
  { objectiveId: 'obj2', qualitativeEval: '结课座谈会 150 人中有 17 人表示对常用接口的功能程序的编写、AD 和 DA 模块编程掌握不好，任课教师建议首先要了解 AD 和 DA 的基本原理，阅读教材相关项目的程序代码，学习他人的编程思路和技巧，再不断做练习并深入思考，可以在 Proteus 仿真环境下根据需求多练习。', analysis: '本课程目标由期末考试、实验构成，从期末考试达成度 0.79 可以看出，学生掌握了课程目标 2 相关的内容，各项分析中反映出仍然有部分学生对并行口地址确定、定时器应用编程等方面掌握一般、少数学生难以完成常用接口电路的软件编程。实验 1-3 的达成度是 0.84，学生整体实验情况良好，极少数学生实验预习完成不理想、实验报告撰写不够完整和规范，但在教师多次督促和教育下，完成了实验项目，达到了实验教学目标的要求，能够按照要求在进行实验连线、程序设计以及根据要求修改程序。' },
  { objectiveId: 'obj3', qualitativeEval: '结课座谈会 150 人中有 10 人表示对于单片机系统设计缺少思路，无从下手，任课教师建议首先对任务要求进行分析，明确技术指标要求，同时在器件选型时要平衡成本、功耗与系统复杂性。多阅读和参考相关文献资料，加入学习小组和技术论坛，与有经验的人交流与探讨，拓宽视野，逐步增长经验并掌握系统设计的精髓。', analysis: '本课程目标由技能测试、实验构成，技能测试的达成度为 0.85，反映出绝大多数学生能够根据任务需求在查阅资料、互相探讨、教师指导的情况下进行单片机系统及程序设计，仅少数学生无法按要求修改程序或进行程序设计。实验 4 的达成度是 0.85，学生整体实验情况良好，达到了实验教学目标的要求，能够按照要求在进行实验连线、程序设计以及根据要求修改程序。' },
];

const initialContinuousImprovement: ContinuousImprovement = {
  previousFeedback: '（1）在提高的学生认识和理解能力的基础上，探索新的讲授方法及辅导策略，并继续通过实验严格监督、多提供练习机会等手段继续加强定时器应用的 C51 语言编程能力，提升课程目标的达成度。\n（2）针对并行口地址确定掌握差的情况，重点是提高的学生认识和理解能力，并通过进一步加大讲解力度、巩固练习等方式提高达成度，同时在考前加大辅导力度。',
  currentEffect: '（1）本年度对学生实验的严格监督，同时进行技能测试，将理论知识运用到实际操作中，专业整体学生对实验开发环境和编程软件掌握良好，同学搭建硬件电路，锻炼了硬件调试能力，对硬件和软件协同工作有了更直观认知。\n（2）在理论授课中，对并行口地址确定等学生掌握较差的知识点，采用项目式、案例式教学，激发了学生的学习兴趣，比上一轮有所提升。',
  currentProblems: '（1）极少数学生的实验预习效果欠佳，实验报告撰写不规范，在实验验收环节，无法依据任务要求及时、准确地修改程序代码。\n（2）少数学生存在惰性思维，缺乏主动思考和探索精神，对课程知识点理解不够深入，例如，在确定并行口地址，准确配置寄存器等方面存在困难，对并行接口的工作模式掌握较差。',
  futureMeasures: '（1）优化整合教学内容，探索将 AI 技术应用到课程教学中，改革教学方法。进一步扩充习题总量，融入工程案例、课程思政案例开展教学，激发学生学习兴趣和主动性，引导学生自主探索、协作学习。\n（2）进一步强化实验教学投入，给学生提供更多的实验锻炼机会。严格监管实验全过程，提高实验结果验收标准，提高学生 C51 语言编程能力，确保课程目标的有效达成。'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'setup' | 'mapping' | 'data' | 'indirect' | 'report'>('setup');
  const [isReversedLayout, setIsReversedLayout] = useState(true); // Default to true: Left = Report, Right = Settings
  
  const [courseInfo, setCourseInfo] = useState<CourseInfo>(initialCourseInfo);
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives);
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [gradReqs, setGradReqs] = useState<GradReq[]>(initialGradReqs);
  const [surveyItems, setSurveyItems] = useState<SurveyItem[]>(initialSurveyItems);
  const [subjectiveEvals, setSubjectiveEvals] = useState<SubjectiveEval[]>(initialSubjectiveEvals);
  const [continuousImprovement, setContinuousImprovement] = useState<ContinuousImprovement>(initialContinuousImprovement);
  const [indirectEvalSettings, setIndirectEvalSettings] = useState<IndirectEvalSettings>({
    excellentWeight: 0.95,
    goodWeight: 0.85,
    mediumWeight: 0.75,
    passWeight: 0.65,
    subjectiveTitle: '主观定性评价达成情况',
    analysisTitle: '达成情况分析'
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <FileBarChart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">成绩分析系统</h1>
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
              支持自定义课程目标、考核方式与权重
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex flex-col ${isReversedLayout ? 'xl:flex-row-reverse' : 'xl:flex-row'} gap-8 relative`}>
          {/* Settings Panel */}
          <div className="w-full xl:w-[calc(50%-2rem)] flex flex-col">
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-8 overflow-x-auto print:hidden">
              <button
                onClick={() => setActiveTab('setup')}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'setup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                1. 基础设置
              </button>
              <button
                onClick={() => setActiveTab('mapping')}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'mapping' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Layers className="w-4 h-4 mr-2" />
                2. 直接评价权重
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'data' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                3. 成绩录入
              </button>
              <button
                onClick={() => setActiveTab('indirect')}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'indirect' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <MessageSquareText className="w-4 h-4 mr-2" />
                4. 间接与定性评价
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`xl:hidden flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'report' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileBarChart className="w-4 h-4 mr-2" />
                5. 达成度报告
              </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
              {activeTab === 'setup' && (
                <SetupTab
                  courseInfo={courseInfo}
                  setCourseInfo={setCourseInfo}
                  objectives={objectives}
                  setObjectives={setObjectives}
                  assessments={assessments}
                  setAssessments={setAssessments}
                  gradReqs={gradReqs}
                  setGradReqs={setGradReqs}
                />
              )}
              {activeTab === 'mapping' && (
                <MappingTab
                  objectives={objectives}
                  assessments={assessments}
                  mappings={mappings}
                  setMappings={setMappings}
                />
              )}
              {activeTab === 'data' && (
                <DataEntryTab
                  objectives={objectives}
                  assessments={assessments}
                  mappings={mappings}
                  students={students}
                  setStudents={setStudents}
                />
              )}
              {activeTab === 'indirect' && (
                <IndirectEvalTab
                  objectives={objectives}
                  surveyItems={surveyItems}
                  setSurveyItems={setSurveyItems}
                  subjectiveEvals={subjectiveEvals}
                  setSubjectiveEvals={setSubjectiveEvals}
                  continuousImprovement={continuousImprovement}
                  setContinuousImprovement={setContinuousImprovement}
                  students={students}
                  mappings={mappings}
                  assessments={assessments}
                  settings={indirectEvalSettings}
                  setSettings={setIndirectEvalSettings}
                />
              )}
              {activeTab === 'report' && (
                <div className="xl:hidden">
                  <ReportTab
                    courseInfo={courseInfo}
                    objectives={objectives}
                    assessments={assessments}
                    mappings={mappings}
                    students={students}
                    gradReqs={gradReqs}
                    surveyItems={surveyItems}
                    subjectiveEvals={subjectiveEvals}
                    continuousImprovement={continuousImprovement}
                    indirectEvalSettings={indirectEvalSettings}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Swap Button (only visible on xl screens) */}
          <div className="hidden xl:flex items-center justify-center w-8 print:hidden">
            <button
              onClick={() => setIsReversedLayout(!isReversedLayout)}
              className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors z-10"
              title="切换左右布局"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Report Preview Panel (only visible on xl screens) */}
          <div className="hidden xl:block w-full xl:w-[calc(50%-2rem)] bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center sticky top-0 bg-white z-10">
              <FileBarChart className="w-5 h-5 mr-2 text-indigo-600" />
              达成度报告实时预览
            </h2>
            <ReportTab
              courseInfo={courseInfo}
              objectives={objectives}
              assessments={assessments}
              mappings={mappings}
              students={students}
              gradReqs={gradReqs}
              surveyItems={surveyItems}
              subjectiveEvals={subjectiveEvals}
              continuousImprovement={continuousImprovement}
              indirectEvalSettings={indirectEvalSettings}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
