import React, { useMemo } from 'react';
import { CourseInfo, Objective, Assessment, Mapping, Student, GradReq, SurveyItem, SubjectiveEval, ContinuousImprovement } from '../types';
import { Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface Props {
  courseInfo: CourseInfo;
  objectives: Objective[];
  assessments: Assessment[];
  mappings: Mapping[];
  students: Student[];
  gradReqs: GradReq[];
  surveyItems: SurveyItem[];
  subjectiveEvals: SubjectiveEval[];
  continuousImprovement: ContinuousImprovement;
}

export default function ReportTab({
  courseInfo,
  objectives,
  assessments,
  mappings,
  students,
  gradReqs,
  surveyItems,
  subjectiveEvals,
  continuousImprovement
}: Props) {
  const activeMappings = mappings.filter(m => m.weight > 0);

  // Calculate averages and achievement degrees for direct evaluation
  const analysis = useMemo(() => {
    const result: Record<string, { avg: number; aad: number }> = {};
    const studentCount = students.length;

    if (studentCount === 0) return result;

    activeMappings.forEach(m => {
      const key = `${m.objectiveId}_${m.assessmentId}`;
      let totalScore = 0;
      let validCount = 0;

      students.forEach(s => {
        if (s.scores[key] !== undefined) {
          totalScore += s.scores[key];
          validCount++;
        }
      });

      const avg = validCount > 0 ? totalScore / validCount : 0;
      const aad = m.targetScore > 0 ? avg / m.targetScore : 0;

      result[key] = { avg, aad };
    });

    return result;
  }, [students, activeMappings]);

  // Calculate overall direct achievement degree for each objective
  const overallDirectAnalysis = useMemo(() => {
    const result: Record<string, number> = {};

    objectives.forEach(obj => {
      let overallAad = 0;
      let totalWeight = 0;

      const objMappings = activeMappings.filter(m => m.objectiveId === obj.id);
      objMappings.forEach(m => {
        const key = `${m.objectiveId}_${m.assessmentId}`;
        const aad = analysis[key]?.aad || 0;
        overallAad += aad * m.weight;
        totalWeight += m.weight;
      });

      result[obj.id] = totalWeight > 0 ? overallAad / totalWeight : 0;
    });

    return result;
  }, [objectives, activeMappings, analysis]);

  // Calculate indirect achievement degree
  const indirectAnalysis = useMemo(() => {
    const itemResults: Record<string, number> = {};
    const objResults: Record<string, number> = {};

    // Calculate per item
    surveyItems.forEach(item => {
      // 调查项目达成度 = (优 + 良 + 中 + 及格) 的百分比之和
      const { excellent, good, medium, pass } = item.percentages;
      itemResults[item.id] = (excellent + good + medium + pass) / 100;
    });

    // Calculate per objective
    objectives.forEach(obj => {
      const items = surveyItems.filter(i => i.objectiveId === obj.id);
      let totalAad = 0;
      let totalWeight = 0;
      items.forEach(item => {
        totalAad += itemResults[item.id] * item.weight;
        totalWeight += item.weight;
      });
      objResults[obj.id] = totalWeight > 0 ? totalAad / totalWeight : 0;
    });

    return { itemResults, objResults };
  }, [surveyItems, objectives]);

  // Calculate final achievement degree
  const finalAnalysis = useMemo(() => {
    const result: Record<string, number> = {};
    // PDF uses 0.9 for direct and 0.1 for indirect
    const directWeight = 0.9;
    const indirectWeight = 0.1;

    objectives.forEach(obj => {
      const direct = overallDirectAnalysis[obj.id] || 0;
      const indirect = indirectAnalysis.objResults[obj.id] || 0;
      result[obj.id] = direct * directWeight + indirect * indirectWeight;
    });

    return result;
  }, [objectives, overallDirectAnalysis, indirectAnalysis]);

  const handlePrint = () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const opt = {
      margin:       10,
      filename:     `${courseInfo.courseName || '课程'}目标达成情况评价报告.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const handleExportWord = () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;

    // Clone the element to manipulate it for Word export
    const clone = reportElement.cloneNode(true) as HTMLElement;
    
    // Remove any Tailwind classes that might interfere or aren't needed in Word
    // and replace them with inline styles where necessary
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
      table.setAttribute('border', '1');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '20px';
      table.style.fontSize = '14px';
      table.style.borderColor = 'black';
    });

    const ths = clone.querySelectorAll('th');
    ths.forEach(th => {
      th.style.border = '1px solid black';
      th.style.padding = '8px';
      if (th.className.includes('bg-orange-50')) {
        th.style.backgroundColor = '#fff7ed';
      }
    });

    const tds = clone.querySelectorAll('td');
    tds.forEach(td => {
      td.style.border = '1px solid black';
      td.style.padding = '8px';
      if (td.className.includes('text-left')) {
        td.style.textAlign = 'left';
      } else {
        td.style.textAlign = 'center';
      }
      if (td.className.includes('bg-orange-50')) {
        td.style.backgroundColor = '#fff7ed';
      }
      if (td.className.includes('bg-slate-100')) {
        td.style.backgroundColor = '#f1f5f9';
      }
      if (td.className.includes('bg-green-50')) {
        td.style.backgroundColor = '#f0fdf4';
      }
    });

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>课程目标达成情况评价报告</title>
        <style>
          body { font-family: SimSun, "宋体", serif; line-height: 1.5; }
          h1 { font-size: 24px; text-align: center; margin-bottom: 10px; }
          h2 { font-size: 20px; text-align: center; margin-bottom: 20px; }
          h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
          h4 { font-size: 16px; margin-top: 15px; margin-bottom: 10px; }
          p { text-indent: 2em; margin-bottom: 10px; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          /* Word specific styles to prevent header repeating and control row height */
          @page { mso-page-border-surround-header: no; mso-page-border-surround-footer: no; }
          table { mso-yfti-tbllook: 1184; mso-padding-alt: 0cm 5.4pt 0cm 5.4pt; }
          tr { mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes; height: auto; }
          td, th { mso-line-height-rule: exactly; }
        </style>
      </head>
      <body>
        ${clone.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword;charset=utf-8'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseInfo.courseName || '课程'}目标达成情况评价报告.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 print:space-y-6">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">课程目标达成情况评价报告</h2>
          <p className="text-slate-500 text-sm">
            基于 OBE 理念的评价结果，可直接打印或保存为 PDF/Word。
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportWord}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> 导出 Word
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> 导出 / 打印 PDF
          </button>
        </div>
      </div>

      {/* 打印区域 */}
      <div id="report-content" className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:p-0 print:shadow-none print:border-none print:text-black">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">《{courseInfo.courseName || '课程名称'}》</h1>
          <h2 className="text-xl font-bold">课程目标达成情况评价报告</h2>
        </div>

        {/* 一、课程基本情况 */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4">一、课程基本情况</h3>
          <table className="w-full border-collapse border border-black text-sm text-center mb-6">
            <tbody>
              <tr>
                <td className="border border-black py-2 px-4 font-bold w-24">授课学期</td>
                <td className="border border-black py-2 px-4">{courseInfo.term}</td>
                <td className="border border-black py-2 px-4 font-bold w-24">授课对象</td>
                <td className="border border-black py-2 px-4">{courseInfo.targetStudents}</td>
                <td className="border border-black py-2 px-4 font-bold w-24">任课教师</td>
                <td className="border border-black py-2 px-4">{courseInfo.teacher}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black text-sm text-center mb-6">
            <thead>
              <tr>
                <th className="border border-black py-2 px-4 w-24">课程目标</th>
                <th className="border border-black py-2 px-4">课程目标具体内容</th>
                <th className="border border-black py-2 px-4 w-32">支撑毕业要求<br/>指标点</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const req = gradReqs.find(r => r.objectiveId === obj.id);
                return (
                  <tr key={obj.id}>
                    <td className="border border-black py-2 px-4 font-bold">{obj.name}</td>
                    <td className="border border-black py-2 px-4 text-left">{obj.description}</td>
                    <td className="border border-black py-2 px-4">{req?.indicator}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black text-sm text-center">
            <tbody>
              <tr>
                <td rowSpan={objectives.length + 1} className="border border-black py-2 px-4 font-bold w-24 align-middle">
                  课程目标达<br/>成途径
                </td>
                <td className="border border-black py-2 px-4 font-bold w-24">目标</td>
                {assessments.map(asm => (
                  <td key={asm.id} className="border border-black py-2 px-4 font-bold">
                    考核方式/权重
                  </td>
                ))}
              </tr>
              {objectives.map(obj => (
                <tr key={obj.id}>
                  <td className="border border-black py-2 px-4">{obj.name}</td>
                  {assessments.map(asm => {
                    const mapping = activeMappings.find(m => m.objectiveId === obj.id && m.assessmentId === asm.id);
                    return (
                      <td key={asm.id} className="border border-black py-2 px-4">
                        {mapping ? `${asm.name} / ${mapping.weight}` : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 二、课程目标达成评价 */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4">二、课程目标达成评价</h3>
          <p className="text-sm mb-4 indent-8 leading-relaxed">
            课程目标达成评价采用直接定量评价和间接定量评价相结合的评价方法，同时辅以主观定性评价判断课程目标的达成情况。
          </p>
          
          <h4 className="text-md font-bold mb-4">（一）直接定量评价结果</h4>
          <p className="text-sm mb-4 indent-8 leading-relaxed">
            直接定量评价计算表见附件 1 ~ 附件 {assessments.length + 1}，课程小组对全体通过考核的学生取样本，针对样本的每项课程目标计算了达成度，评价结果如下：
          </p>
          
          <div className="mb-2 text-sm font-bold">评价责任人：{courseInfo.teacher}</div>
          <table className="w-full border-collapse border border-black text-sm text-center mb-8">
            <thead>
              <tr>
                <th colSpan={assessments.length + 2} className="border border-black py-2 px-4 font-bold">
                  课程目标达成情况评价结果——直接定量评价
                </th>
              </tr>
              <tr>
                <th className="border border-black py-2 px-4 font-bold w-32">评价方法</th>
                <td colSpan={Math.max(1, assessments.length - 1)} className="border border-black py-2 px-4 font-bold">直接定量评价</td>
                <th className="border border-black py-2 px-4 font-bold w-32">评价样本数</th>
                <td className="border border-black py-2 px-4 font-bold w-32">{students.length}</td>
              </tr>
              <tr>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold">课程目标</th>
                <th colSpan={assessments.length} className="border border-black py-2 px-4 font-bold">
                  支撑课程目标各评价环节的达成度
                </th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold">
                  课程目标达成度
                </th>
              </tr>
              <tr>
                {assessments.map(asm => (
                  <th key={asm.id} className="border border-black py-2 px-4 font-bold">
                    {asm.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => (
                <tr key={obj.id}>
                  <td className="border border-black py-2 px-4 font-bold">{obj.name}</td>
                  {assessments.map(asm => {
                    const key = `${obj.id}_${asm.id}`;
                    const mapping = activeMappings.find(m => m.objectiveId === obj.id && m.assessmentId === asm.id);
                    const aad = analysis[key]?.aad;
                    return (
                      <td key={asm.id} className="border border-black py-2 px-4">
                        {mapping && aad !== undefined ? aad.toFixed(2) : ''}
                      </td>
                    );
                  })}
                  <td className="border border-black py-2 px-4 font-bold">
                    {overallDirectAnalysis[obj.id] !== undefined ? overallDirectAnalysis[obj.id].toFixed(2) : ''}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="border border-black py-2 px-4 font-bold">支撑材料</td>
                <td colSpan={assessments.length + 1} className="border border-black py-2 px-4 text-left">
                  附件 1 ~ 附件 {assessments.length + 1}
                </td>
              </tr>
            </tbody>
          </table>

          <h4 className="text-md font-bold mb-4">（二）间接定量评价结果</h4>
          <p className="text-sm mb-4 indent-8 leading-relaxed">
            间接定量评价计算表见附件 {assessments.length + 2}，任课教师向学生下发了《课程目标达成情况调查问卷》，每项课程目标达成评价结果如下：
          </p>

          <div className="mb-2 text-sm font-bold">评价责任人：{courseInfo.teacher}</div>
          <table className="w-full border-collapse border border-black text-sm text-center mb-8">
            <thead>
              <tr>
                <th colSpan={8} className="border border-black py-2 px-4 font-bold">
                  课程目标达成情况评价结果——间接定量评价
                </th>
              </tr>
              <tr>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold w-16">课程<br/>目标</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold w-24">调查项目</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold w-16">权重</th>
                <th colSpan={4} className="border border-black py-2 px-4 font-bold">各档的评价度样本百分数</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold w-24">调查项目达成<br/>度</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold w-24">课程目标达<br/>成度</th>
              </tr>
              <tr>
                <th className="border border-black py-1 px-2 font-normal">0.9~1.0<br/>（优）</th>
                <th className="border border-black py-1 px-2 font-normal">0.8~0.9<br/>（良）</th>
                <th className="border border-black py-1 px-2 font-normal">0.7~0.8<br/>（中）</th>
                <th className="border border-black py-1 px-2 font-normal">0.6~0.7<br/>（及格）</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const items = surveyItems.filter(i => i.objectiveId === obj.id);
                if (items.length === 0) return null;
                
                return items.map((item, idx) => (
                  <tr key={item.id}>
                    {idx === 0 && (
                      <td rowSpan={items.length} className="border border-black py-2 px-4 font-bold align-middle">{obj.name}</td>
                    )}
                    <td className="border border-black py-2 px-4">调查项目 {surveyItems.findIndex(i => i.id === item.id) + 1}</td>
                    <td className="border border-black py-2 px-4">{item.weight}</td>
                    <td className="border border-black py-2 px-4">{item.percentages.excellent}%</td>
                    <td className="border border-black py-2 px-4">{item.percentages.good}%</td>
                    <td className="border border-black py-2 px-4">{item.percentages.medium}%</td>
                    <td className="border border-black py-2 px-4">{item.percentages.pass}%</td>
                    <td className="border border-black py-2 px-4 bg-slate-100">{(indirectAnalysis.itemResults[item.id] * 100).toFixed(1)}%</td>
                    {idx === 0 && (
                      <td rowSpan={items.length} className="border border-black py-2 px-4 font-bold bg-slate-100 align-middle">
                        {(indirectAnalysis.objResults[obj.id] * 100).toFixed(1)}%
                      </td>
                    )}
                  </tr>
                ));
              })}
              <tr>
                <td className="border border-black py-2 px-4 font-bold">支撑材料</td>
                <td colSpan={8} className="border border-black py-2 px-4 text-left">
                  附件 {assessments.length + 2}
                </td>
              </tr>
              {surveyItems.map((item, idx) => (
                <tr key={`desc_${item.id}`}>
                  <td className="border border-black py-2 px-4">调查项目 {idx + 1}</td>
                  <td colSpan={8} className="border border-black py-2 px-4 text-left">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 className="text-md font-bold mb-4">（三）主观定性评价</h4>
          <p className="text-sm mb-8 indent-8 leading-relaxed">
            课程结束后，任课教师召开了座谈会，就课程目标的达成情况进行了面对面交流，参加的学生进行了自我评价，提出了一些不足，任课教师进行了问题解答，并给予了后续学习的建议，同时给出了评价结果。
          </p>

          <h4 className="text-md font-bold mb-4">（四）定量评价最终结论</h4>
          <p className="text-sm mb-4 indent-8 leading-relaxed">
            课程目标达成的最终评价结论按照定量评价为主、定性评价为辅的原则给出，课程小组按课程及格作为评价标准，标准量化值确定为 0.65，具体达成结论如下：
          </p>

          <div className="mb-2 text-sm font-bold">评价责任人：{courseInfo.teacher}</div>
          <table className="w-full border-collapse border border-black text-sm text-center mb-8">
            <thead>
              <tr>
                <th className="border border-black py-2 px-4 font-bold w-20">课程目标</th>
                <th colSpan={4} className="border border-black py-2 px-4 font-bold">客观定量评价达成度</th>
                <th className="border border-black py-2 px-4 font-bold">主观定性评价达成情况</th>
                <th className="border border-black py-2 px-4 font-bold w-24">达成结果<br/>评价标准 0.65</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const evalData = subjectiveEvals.find(e => e.objectiveId === obj.id);
                const finalScore = finalAnalysis[obj.id] || 0;
                const isAchieved = finalScore >= 0.65;
                
                return (
                  <React.Fragment key={obj.id}>
                    <tr>
                      <td rowSpan={3} className="border border-black py-2 px-4 font-bold align-middle bg-orange-50/30">{obj.name}</td>
                      <td colSpan={2} className="border border-black py-1 px-2 font-bold bg-slate-100">直接定量评价</td>
                      <td colSpan={2} className="border border-black py-1 px-2 font-bold bg-slate-100">间接定量评价</td>
                      <td rowSpan={3} className="border border-black py-2 px-4 text-left align-top text-xs leading-relaxed">
                        {evalData?.qualitativeEval}
                      </td>
                      <td rowSpan={3} className="border border-black py-2 px-4 align-middle">
                        {isAchieved ? '达成' : '未达成'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1 px-2 font-bold">达成度</td>
                      <td className="border border-black py-1 px-2 font-bold">权重</td>
                      <td className="border border-black py-1 px-2 font-bold">达成度</td>
                      <td className="border border-black py-1 px-2 font-bold">权重</td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1 px-2 font-bold">{overallDirectAnalysis[obj.id]?.toFixed(2)}</td>
                      <td className="border border-black py-1 px-2 font-bold">0.9</td>
                      <td className="border border-black py-1 px-2 font-bold">{indirectAnalysis.objResults[obj.id]?.toFixed(2)}</td>
                      <td className="border border-black py-1 px-2 font-bold">0.1</td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="border border-black py-2 px-4 font-bold text-left bg-orange-50/30">
                        总达成度：{finalScore.toFixed(2)}
                      </td>
                      <td colSpan={2} className="border border-black py-2 px-4 bg-orange-50/30"></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <h4 className="text-md font-bold mb-4">（五）课程目标达成结果分析</h4>
          <div className="mb-2 text-sm font-bold">评价责任人：{courseInfo.teacher}</div>
          <table className="w-full border-collapse border border-black text-sm text-center mb-8">
            <thead>
              <tr>
                <th className="border border-black py-2 px-4 font-bold w-24">课程目标</th>
                <th className="border border-black py-2 px-4 font-bold bg-orange-50/30">达成情况分析</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const evalData = subjectiveEvals.find(e => e.objectiveId === obj.id);
                return (
                  <tr key={obj.id}>
                    <td className="border border-black py-2 px-4 font-bold">{obj.name}</td>
                    <td className="border border-black py-4 px-6 text-left leading-relaxed">
                      {evalData?.analysis}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* 三、课程目标支撑毕业要求的达成度 */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4">三、课程目标支撑毕业要求的达成度</h3>
          <div className="mb-2 text-sm font-bold">评价责任人：{courseInfo.teacher}</div>
          <table className="w-full border-collapse border border-black text-sm text-center mb-8">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold w-24 bg-orange-50/30">课程目标</th>
                <th colSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30">课程目标达成情况</th>
                <th colSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30">支撑毕业要求情况</th>
              </tr>
              <tr>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">达成度</th>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">权重</th>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">指标点</th>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">达成度</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const req = gradReqs.find(r => r.objectiveId === obj.id);
                const finalScore = finalAnalysis[obj.id] || 0;
                const reqAchievement = req ? finalScore * req.weight : 0;
                return (
                  <tr key={obj.id}>
                    <td className="border border-black py-2 px-4 font-bold">{obj.name}</td>
                    <td className="border border-black py-2 px-4">{finalScore.toFixed(2)}</td>
                    <td className="border border-black py-2 px-4">{req?.weight}</td>
                    <td className="border border-black py-2 px-4">{req?.indicator}</td>
                    <td className="border border-black py-2 px-4">{reqAchievement.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* 四、课程目标达成持续改进情况 */}
        <section className="mb-8">
          <h3 className="text-lg font-bold mb-4">四、课程目标达成持续改进情况</h3>
          <div className="mb-2 text-sm font-bold">责任人：{courseInfo.teacher}</div>
          <table className="w-full border-collapse border border-black text-sm text-left mb-8">
            <thead>
              <tr>
                <th className="border border-black py-2 px-4 font-bold w-1/2 text-center bg-orange-50/30">上一年度的提出的改进意见</th>
                <th className="border border-black py-2 px-4 font-bold w-1/2 text-center bg-orange-50/30">本年度的改进实施效果</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-4 px-4 whitespace-pre-wrap leading-relaxed align-top">
                  {continuousImprovement.previousFeedback}
                </td>
                <td className="border border-black py-4 px-4 whitespace-pre-wrap leading-relaxed align-top">
                  {continuousImprovement.currentEffect}
                </td>
              </tr>
              <tr>
                <th className="border border-black py-2 px-4 font-bold text-center bg-orange-50/30">本年度的问题</th>
                <th className="border border-black py-2 px-4 font-bold text-center bg-orange-50/30">拟在下一年度的改进措施</th>
              </tr>
              <tr>
                <td className="border border-black py-4 px-4 whitespace-pre-wrap leading-relaxed align-top">
                  {continuousImprovement.currentProblems}
                </td>
                <td className="border border-black py-4 px-4 whitespace-pre-wrap leading-relaxed align-top">
                  {continuousImprovement.futureMeasures}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-between text-sm font-bold mt-8">
            <div>报告撰写人：{courseInfo.teacher}</div>
            <div>报告审核人：________________</div>
          </div>
        </section>

        {/* 附件区域 */}
        {assessments.map((asm, index) => {
          // Calculate averages for this assessment for ALL objectives
          const asmAvgs: Record<string, number> = {};
          objectives.forEach(obj => {
            const key = `${obj.id}_${asm.id}`;
            asmAvgs[obj.id] = analysis[key]?.avg || 0;
          });

          return (
            <section key={`attachment_${asm.id}`} className="print:break-before-page mt-16 pt-8" style={{ pageBreakBefore: 'always' }}>
              <h3 className="text-xl font-bold mb-4">附件 {index + 1}：</h3>
              <h4 className="text-lg font-bold text-center mb-4">
                《{courseInfo.courseName}》课程目标达成度计算—{asm.name}
              </h4>
              <div className="flex justify-between text-sm mb-2">
                <span>学期：{courseInfo.term}</span>
                <span>评价班级：{courseInfo.targetStudents}</span>
                <span>评价责任人：{courseInfo.teacher}</span>
              </div>
              
              <table className="w-full border-collapse border border-black text-sm text-center" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th colSpan={objectives.length + 4} className="border border-black py-2 px-4 font-bold bg-orange-50/30">
                      课程目标达成度
                    </th>
                  </tr>
                  <tr>
                    <th rowSpan={5} className="border border-black py-2 px-2 font-bold w-12">序号</th>
                    <th rowSpan={5} className="border border-black py-2 px-4 font-bold w-32">学号</th>
                    <th rowSpan={5} className="border border-black py-2 px-4 font-bold w-24">姓名</th>
                    <th colSpan={objectives.length + 1} className="border border-black py-1 px-4 font-bold bg-orange-50/30">
                      支撑课程目标试题的总分值
                    </th>
                  </tr>
                  <tr>
                    {objectives.map(obj => (
                      <th key={`h_obj_${obj.id}`} className="border border-black py-1 px-4 font-bold">{obj.name}</th>
                    ))}
                    <th className="border border-black py-1 px-4 font-bold">总分值</th>
                  </tr>
                  <tr>
                    {objectives.map(obj => {
                      const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                      return (
                        <th key={`h_score_${obj.id}`} className="border border-black py-1 px-4 font-normal">
                          {m ? m.targetScore : ''}
                        </th>
                      );
                    })}
                    <th className="border border-black py-1 px-4 font-normal">
                      {objectives.reduce((sum, obj) => {
                        const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                        return sum + (m ? m.targetScore : 0);
                      }, 0)}
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={objectives.length + 1} className="border border-black py-1 px-4 font-bold bg-orange-50/30">
                      支撑课程目标试题的实际得分
                    </th>
                  </tr>
                  <tr>
                    {objectives.map(obj => (
                      <th key={`h_obj2_${obj.id}`} className="border border-black py-1 px-4 font-bold">{obj.name}</th>
                    ))}
                    <th className="border border-black py-1 px-4 font-bold">总分值</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, sIdx) => {
                    let studentTotal = 0;
                    return (
                      <tr key={student.id}>
                        <td className="border border-black py-1 px-2">{sIdx + 1}</td>
                        <td className="border border-black py-1 px-4">{student.studentId}</td>
                        <td className="border border-black py-1 px-4">{student.name}</td>
                        {objectives.map(obj => {
                          const key = `${obj.id}_${asm.id}`;
                          const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                          const score = m && student.scores[key] !== undefined ? student.scores[key] : null;
                          if (score !== null) studentTotal += score;
                          return (
                            <td key={key} className="border border-black py-1 px-4">
                              {score !== null ? score : ''}
                            </td>
                          );
                        })}
                        <td className="border border-black py-1 px-4 font-bold">{studentTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} rowSpan={6} className="border border-black py-2 px-4 font-bold align-middle text-center bg-orange-50/30">
                      达成度 = 平均得分 / 总分值
                    </td>
                    <td colSpan={objectives.length + 1} className="border border-black py-1 px-4 font-bold bg-orange-50/30">
                      支撑课程目标的 {asm.name} 平均得分
                    </td>
                  </tr>
                  <tr>
                    {objectives.map(obj => (
                      <td key={`f_obj_${obj.id}`} className="border border-black py-1 px-4 font-bold">{obj.name}</td>
                    ))}
                    <td className="border border-black py-1 px-4 font-bold">总分值</td>
                  </tr>
                  <tr>
                    {objectives.map(obj => {
                      const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                      return (
                        <td key={`f_avg_${obj.id}`} className="border border-black py-1 px-4">
                          {m ? asmAvgs[obj.id].toFixed(2) : ''}
                        </td>
                      );
                    })}
                    <td className="border border-black py-1 px-4 font-bold">
                      {objectives.reduce((sum, obj) => {
                        const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                        return sum + (m ? asmAvgs[obj.id] : 0);
                      }, 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={objectives.length + 1} className="border border-black py-1 px-4 font-bold bg-orange-50/30">
                      {asm.name} 环节课程目标的达成度
                    </td>
                  </tr>
                  <tr>
                    {objectives.map(obj => (
                      <td key={`f_obj2_${obj.id}`} className="border border-black py-1 px-4 font-bold">{obj.name}</td>
                    ))}
                    <td className="border border-black py-1 px-4 font-bold">总达成度</td>
                  </tr>
                  <tr>
                    {objectives.map(obj => {
                      const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                      const ach = m && m.targetScore > 0 ? asmAvgs[obj.id] / m.targetScore : 0;
                      return (
                        <td key={`f_ach_${obj.id}`} className="border border-black py-1 px-4">
                          {m ? ach.toFixed(2) : ''}
                        </td>
                      );
                    })}
                    <td className="border border-black py-1 px-4 font-bold">
                      {(() => {
                        const totalAvg = objectives.reduce((sum, obj) => {
                          const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                          return sum + (m ? asmAvgs[obj.id] : 0);
                        }, 0);
                        const totalMax = objectives.reduce((sum, obj) => {
                          const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                          return sum + (m ? m.targetScore : 0);
                        }, 0);
                        return totalMax > 0 ? (totalAvg / totalMax).toFixed(2) : '0.00';
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          );
        })}

        {/* 附件：直接定量评价汇总 */}
        <section className="print:break-before-page mt-16 pt-8" style={{ pageBreakBefore: 'always' }}>
          <h3 className="text-xl font-bold mb-4">附件 {assessments.length + 1}：</h3>
          <h4 className="text-lg font-bold text-center mb-4">
            《{courseInfo.courseName}》课程目标达成度计算—直接定量评价
          </h4>
          <div className="flex justify-between text-sm mb-2">
            <span>学期：{courseInfo.term}</span>
            <span>评价班级：{courseInfo.targetStudents}</span>
            <span>评价责任人：{courseInfo.teacher}</span>
          </div>
          
          <table className="w-full border-collapse border border-black text-sm text-center" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th colSpan={objectives.length * (assessments.length + 1) + 1} className="border border-black py-2 px-4 font-bold bg-orange-50/30">
                  直接定量评价—课程目标达成度
                </th>
              </tr>
              <tr>
                <th rowSpan={3} className="border border-black py-2 px-2 font-bold bg-orange-50/30 w-16"></th>
                {objectives.map(obj => (
                  <React.Fragment key={`w_${obj.id}`}>
                    <th colSpan={assessments.length} className="border border-black py-1 px-2 font-bold bg-orange-50/30">
                      各评价环节权重 ({obj.name})
                    </th>
                    <th rowSpan={3} className="border border-black py-2 px-2 font-bold bg-orange-50/30 w-24">
                      {obj.name}<br/>达成度<br/>加权值
                    </th>
                  </React.Fragment>
                ))}
              </tr>
              <tr>
                {objectives.map(obj => (
                  assessments.map(asm => (
                    <th key={`h_${obj.id}_${asm.id}`} className="border border-black py-1 px-2 font-bold">
                      {asm.name}
                    </th>
                  ))
                ))}
              </tr>
              <tr>
                {objectives.map(obj => (
                  assessments.map(asm => {
                    const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                    return (
                      <th key={`hw_${obj.id}_${asm.id}`} className="border border-black py-1 px-2 font-normal">
                        {m ? m.weight : ''}
                      </th>
                    );
                  })
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-2 px-2 font-bold bg-orange-50/30">达成度</td>
                {objectives.map(obj => (
                  <React.Fragment key={`obj_row_${obj.id}`}>
                    {assessments.map(asm => {
                      const key = `${obj.id}_${asm.id}`;
                      const m = activeMappings.find(map => map.objectiveId === obj.id && map.assessmentId === asm.id);
                      return (
                        <td key={`v_${obj.id}_${asm.id}`} className="border border-black py-2 px-2">
                          {m && analysis[key] ? analysis[key].aad.toFixed(2) : ''}
                        </td>
                      );
                    })}
                    <td className="border border-black py-2 px-2 font-bold bg-green-50/50">
                      {overallDirectAnalysis[obj.id]?.toFixed(2)}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </section>

        {/* 附件：间接定量评价汇总 */}
        <section className="print:break-before-page mt-16 pt-8" style={{ pageBreakBefore: 'always' }}>
          <h3 className="text-xl font-bold mb-4">附件 {assessments.length + 2}：</h3>
          <h4 className="text-lg font-bold text-center mb-4">
            《{courseInfo.courseName}》课程目标达成度计算—间接定量评价
          </h4>
          <div className="flex justify-between text-sm mb-2">
            <span>学期：{courseInfo.term}</span>
            <span>评价班级：{courseInfo.targetStudents}</span>
            <span>评价责任人：{courseInfo.teacher}</span>
          </div>
          
          <table className="w-full border-collapse border border-black text-sm text-center">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30 w-16">课程<br/>目标</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30">调查项目</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30 w-16">权重</th>
                <th colSpan={4} className="border border-black py-2 px-4 font-bold bg-orange-50/30">各档的评价度样本百分数</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30 w-24">调查项目<br/>达成度</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30 w-24">课程目标<br/>达成度</th>
              </tr>
              <tr>
                <th className="border border-black py-1 px-2 font-normal bg-orange-50/30">0.9~1.0<br/>（优）</th>
                <th className="border border-black py-1 px-2 font-normal bg-orange-50/30">0.8~0.9<br/>（良）</th>
                <th className="border border-black py-1 px-2 font-normal bg-orange-50/30">0.7~0.8<br/>（中）</th>
                <th className="border border-black py-1 px-2 font-normal bg-orange-50/30">0.6~0.7<br/>（及格）</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const items = surveyItems.filter(i => i.objectiveId === obj.id);
                if (items.length === 0) return null;
                
                return items.map((item, idx) => (
                  <tr key={item.id}>
                    {idx === 0 && (
                      <td rowSpan={items.length} className="border border-black py-2 px-4 font-bold align-middle">{obj.name}</td>
                    )}
                    <td className="border border-black py-2 px-4 text-left">{item.description}</td>
                    <td className="border border-black py-2 px-4">{item.weight}</td>
                    <td className="border border-black py-2 px-4">{item.percentages.excellent}%</td>
                    <td className="border border-black py-2 px-4">{item.percentages.good}%</td>
                    <td className="border border-black py-2 px-4">{item.percentages.medium}%</td>
                    <td className="border border-black py-2 px-4">{item.percentages.pass}%</td>
                    <td className="border border-black py-2 px-4 bg-slate-100">{(indirectAnalysis.itemResults[item.id] * 100).toFixed(1)}%</td>
                    {idx === 0 && (
                      <td rowSpan={items.length} className="border border-black py-2 px-4 font-bold bg-green-50/50 align-middle">
                        {(indirectAnalysis.objResults[obj.id] * 100).toFixed(1)}%
                      </td>
                    )}
                  </tr>
                ));
              })}
              <tr>
                <td colSpan={9} className="border border-black py-2 px-4 font-bold text-center">
                  说明：（1）调查项目达成度为本项目样本百分数之和；（2）课程目标达成度为本目标调查项目达成度加权值
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 附件：主观定性评价记录 */}
        <section className="print:break-before-page mt-16 pt-8" style={{ pageBreakBefore: 'always' }}>
          <h3 className="text-xl font-bold mb-4">附件 {assessments.length + 3}：</h3>
          <h4 className="text-lg font-bold text-center mb-4">
            《{courseInfo.courseName}》课程目标达成度计算—各项目标总达成度
          </h4>
          <div className="flex justify-between text-sm mb-2">
            <span>学期：{courseInfo.term}</span>
            <span>评价班级：{courseInfo.targetStudents}</span>
            <span>评价责任人：{courseInfo.teacher}</span>
          </div>
          <table className="w-full border-collapse border border-black text-sm text-center">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30 w-20">课程目标</th>
                <th colSpan={4} className="border border-black py-2 px-4 font-bold bg-orange-50/30">客观定量评价达成度</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30">主观定性评价达成情况</th>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30 w-24">达成结果<br/>评价标准 0.65</th>
              </tr>
              <tr>
                <th colSpan={2} className="border border-black py-1 px-2 font-bold bg-cyan-50/50">直接定量评价</th>
                <th colSpan={2} className="border border-black py-1 px-2 font-bold bg-cyan-50/50">间接定量评价</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const evalData = subjectiveEvals.find(e => e.objectiveId === obj.id);
                const finalScore = finalAnalysis[obj.id] || 0;
                const isAchieved = finalScore >= 0.65;
                
                return (
                  <React.Fragment key={obj.id}>
                    <tr>
                      <td rowSpan={3} className="border border-black py-2 px-4 font-bold align-middle bg-orange-50/30">{obj.name}</td>
                      <td className="border border-black py-1 px-2 font-bold bg-cyan-50/50">达成度</td>
                      <td className="border border-black py-1 px-2 font-bold bg-cyan-50/50">权重</td>
                      <td className="border border-black py-1 px-2 font-bold bg-cyan-50/50">达成度</td>
                      <td className="border border-black py-1 px-2 font-bold bg-cyan-50/50">权重</td>
                      <td rowSpan={3} className="border border-black py-2 px-4 text-left align-top leading-relaxed whitespace-pre-wrap">
                        {evalData?.qualitativeEval}
                      </td>
                      <td rowSpan={3} className="border border-black py-2 px-4 align-middle">
                        {isAchieved ? '达成' : '未达成'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black py-1 px-2 font-bold">{overallDirectAnalysis[obj.id]?.toFixed(2)}</td>
                      <td className="border border-black py-1 px-2 font-bold">0.9</td>
                      <td className="border border-black py-1 px-2 font-bold">{indirectAnalysis.objResults[obj.id]?.toFixed(2)}</td>
                      <td className="border border-black py-1 px-2 font-bold">0.1</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="border border-black py-2 px-4 font-bold text-left bg-orange-50/30">
                        总达成度：{finalScore.toFixed(2)}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* 附件：课程目标支撑毕业要求的达成度 */}
        <section className="print:break-before-page mt-16 pt-8" style={{ pageBreakBefore: 'always' }}>
          <h3 className="text-xl font-bold mb-4">附件 {assessments.length + 4}：</h3>
          <h4 className="text-lg font-bold text-center mb-4">
            《{courseInfo.courseName}》课程目标支撑毕业要求的达成度
          </h4>
          <div className="flex justify-between text-sm mb-2">
            <span>学期：{courseInfo.term}</span>
            <span>评价班级：{courseInfo.targetStudents}</span>
            <span>评价责任人：{courseInfo.teacher}</span>
          </div>
          <table className="w-full border-collapse border border-black text-sm text-center" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th rowSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30">
                  课程目标
                </th>
                <th colSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30">
                  课程目标达成情况
                </th>
                <th colSpan={2} className="border border-black py-2 px-4 font-bold bg-orange-50/30">
                  支撑毕业要求情况
                </th>
              </tr>
              <tr>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">达成度</th>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">权重</th>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">指标点</th>
                <th className="border border-black py-1 px-4 font-bold bg-orange-50/30">达成度</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map(obj => {
                const finalScore = finalAnalysis[obj.id] || 0;
                const reqs = gradReqs.filter(r => r.objectiveId === obj.id);
                // If there are no requirements for this objective, render a single row with empty values
                if (reqs.length === 0) {
                  return (
                    <tr key={obj.id}>
                      <td className="border border-black py-2 px-4 font-bold">{obj.name}</td>
                      <td className="border border-black py-2 px-4">{finalScore.toFixed(2)}</td>
                      <td className="border border-black py-2 px-4">-</td>
                      <td className="border border-black py-2 px-4">-</td>
                      <td className="border border-black py-2 px-4">-</td>
                    </tr>
                  );
                }
                // If there are multiple requirements, span the objective and achievement degree columns
                return reqs.map((req, idx) => (
                  <tr key={`${obj.id}_${idx}`}>
                    {idx === 0 && (
                      <>
                        <td rowSpan={reqs.length} className="border border-black py-2 px-4 font-bold align-middle">
                          {obj.name}
                        </td>
                        <td rowSpan={reqs.length} className="border border-black py-2 px-4 align-middle">
                          {finalScore.toFixed(2)}
                        </td>
                      </>
                    )}
                    <td className="border border-black py-2 px-4">{req.weight}</td>
                    <td className="border border-black py-2 px-4">{req.indicator}</td>
                    <td className="border border-black py-2 px-4">{(finalScore * req.weight).toFixed(3)}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </section>

      </div>
    </div>
  );
}

