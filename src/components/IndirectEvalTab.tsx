import React, { useState } from 'react';
import { Objective, SurveyItem, SubjectiveEval, ContinuousImprovement, Student, Mapping, Assessment } from '../types';
import { Plus, Trash2, Copy, Check, MessageSquareText } from 'lucide-react';

interface Props {
  objectives: Objective[];
  surveyItems: SurveyItem[];
  setSurveyItems: (items: SurveyItem[]) => void;
  subjectiveEvals: SubjectiveEval[];
  setSubjectiveEvals: (evals: SubjectiveEval[]) => void;
  continuousImprovement: ContinuousImprovement;
  setContinuousImprovement: (ci: ContinuousImprovement) => void;
  students: Student[];
  mappings: Mapping[];
  assessments: Assessment[];
}

export default function IndirectEvalTab({
  objectives,
  surveyItems,
  setSurveyItems,
  subjectiveEvals,
  setSubjectiveEvals,
  continuousImprovement,
  setContinuousImprovement,
  students,
  mappings,
  assessments
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleAddSurveyItem = (objectiveId: string) => {
    const newId = `survey_${Date.now()}`;
    setSurveyItems([
      ...surveyItems,
      {
        id: newId,
        objectiveId,
        description: '',
        weight: 0.5,
        percentages: { excellent: 0, good: 0, medium: 0, pass: 0 }
      }
    ]);
  };

  const handleRemoveSurveyItem = (id: string) => {
    setSurveyItems(surveyItems.filter(item => item.id !== id));
  };

  const handleUpdateSurveyItem = (id: string, field: string, value: any) => {
    setSurveyItems(surveyItems.map(item => {
      if (item.id === id) {
        if (field.startsWith('percentages.')) {
          const subField = field.split('.')[1];
          return { ...item, percentages: { ...item.percentages, [subField]: value } };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleUpdateSubjectiveEval = (objectiveId: string, field: 'qualitativeEval' | 'analysis', value: string) => {
    const existing = subjectiveEvals.find(e => e.objectiveId === objectiveId);
    if (existing) {
      setSubjectiveEvals(subjectiveEvals.map(e => e.objectiveId === objectiveId ? { ...e, [field]: value } : e));
    } else {
      setSubjectiveEvals([...subjectiveEvals, { objectiveId, qualitativeEval: '', analysis: '', [field]: value }]);
    }
  };

  const getSubjectiveEval = (objectiveId: string) => {
    return subjectiveEvals.find(e => e.objectiveId === objectiveId) || { objectiveId, qualitativeEval: '', analysis: '' };
  };

  const generateAIPrompt = () => {
    let prompt = `我需要你帮我分析一份基于OBE理念的课程目标达成情况评价报告。以下是相关数据：\n\n`;
    
    prompt += `【课程目标】\n`;
    objectives.forEach((obj, idx) => {
      prompt += `${idx + 1}. ${obj.name}: ${obj.description}\n`;
    });

    prompt += `\n【考核方式】\n`;
    assessments.forEach(asm => {
      prompt += `- ${asm.name}\n`;
    });

    prompt += `\n【直接评价成绩汇总】\n`;
    prompt += `共有 ${students.length} 名学生。\n`;
    
    objectives.forEach(obj => {
      prompt += `针对 ${obj.name}：\n`;
      const objMappings = mappings.filter(m => m.objectiveId === obj.id && m.weight > 0);
      objMappings.forEach(m => {
        const asm = assessments.find(a => a.id === m.assessmentId);
        if (asm) {
          const key = `${obj.id}_${asm.id}`;
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
          prompt += `  - ${asm.name}环节：满分 ${m.targetScore}，平均分 ${avg.toFixed(2)}，达成度 ${aad.toFixed(3)}\n`;
        }
      });
    });

    prompt += `\n【间接评价（问卷调查）结果】\n`;
    surveyItems.forEach((item, idx) => {
      const obj = objectives.find(o => o.id === item.objectiveId);
      prompt += `调查项目 ${idx + 1} (对应 ${obj?.name})：${item.description}\n`;
      prompt += `  - 优(0.9~1.0): ${item.percentages.excellent}%\n`;
      prompt += `  - 良(0.8~0.9): ${item.percentages.good}%\n`;
      prompt += `  - 中(0.7~0.8): ${item.percentages.medium}%\n`;
      prompt += `  - 及格(0.6~0.7): ${item.percentages.pass}%\n`;
    });

    prompt += `\n请你作为一位资深的工程教育认证专家，根据以上数据，为我生成以下内容：\n`;
    prompt += `1. 针对每个课程目标的【主观定性评价】（结合学生座谈会反馈的假设情景，指出学生的薄弱点和改进建议，每条约100字）。\n`;
    prompt += `2. 针对每个课程目标的【达成情况分析】（结合直接评价和间接评价的数据进行客观分析，指出教学效果和存在的问题，每条约150字）。\n`;
    prompt += `3. 针对整门课程的【持续改进情况】，包括：\n`;
    prompt += `   - 本年度的问题（总结上述分析中发现的主要问题）\n`;
    prompt += `   - 拟在下一年度的改进措施（针对问题提出具体、可操作的教学改进措施）\n`;

    return prompt;
  };

  const handleCopyPrompt = () => {
    const prompt = generateAIPrompt();
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <MessageSquareText className="w-5 h-5 mr-2" />
          AI 辅助分析助手
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          本系统支持生成包含当前课程所有成绩数据和设置的提示词（Prompt）。您可以将此提示词复制并发送给 DeepSeek、文心一言等 AI 助手，让其为您生成专业的定性评价和持续改进建议。
        </p>
        <button
          onClick={handleCopyPrompt}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? '已复制提示词' : '一键复制 AI 提示词'}
        </button>
      </div>

      {/* 间接定量评价设置 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">间接定量评价（问卷调查）</h2>
        <p className="text-sm text-slate-500 mb-6">
          为每个课程目标设置调查项目、权重及各档评价百分比（输入百分比数值，如 24.7）。
        </p>

        <div className="space-y-6">
          {objectives.map(obj => {
            const items = surveyItems.filter(item => item.objectiveId === obj.id);
            return (
              <div key={obj.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-medium text-slate-800">{obj.name}</h3>
                  <button
                    onClick={() => handleAddSurveyItem(obj.id)}
                    className="flex items-center px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-xs font-medium shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> 添加调查项目
                  </button>
                </div>
                <div className="p-4 space-y-4 bg-white">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-700 mb-1">调查项目 {index + 1} 描述</label>
                          <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                            rows={2}
                            value={item.description}
                            onChange={(e) => handleUpdateSurveyItem(item.id, 'description', e.target.value)}
                            placeholder="例如：能够理解和掌握..."
                          />
                        </div>
                        <div className="w-24 shrink-0">
                          <label className="block text-xs font-medium text-slate-700 mb-1">权重 (0~1)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={item.weight}
                            onChange={(e) => handleUpdateSurveyItem(item.id, 'weight', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveSurveyItem(item.id)}
                          className="mt-6 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除调查项目"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">优 (0.9~1.0) %</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={item.percentages.excellent}
                            onChange={(e) => handleUpdateSurveyItem(item.id, 'percentages.excellent', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">良 (0.8~0.9) %</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={item.percentages.good}
                            onChange={(e) => handleUpdateSurveyItem(item.id, 'percentages.good', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">中 (0.7~0.8) %</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={item.percentages.medium}
                            onChange={(e) => handleUpdateSurveyItem(item.id, 'percentages.medium', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">及格 (0.6~0.7) %</label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            value={item.percentages.pass}
                            onChange={(e) => handleUpdateSurveyItem(item.id, 'percentages.pass', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">暂无调查项目</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 主观定性评价与达成情况分析 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">主观定性评价与达成情况分析</h2>
        <p className="text-sm text-slate-500 mb-6">
          请针对每个课程目标填写主观定性评价（如座谈会反馈）以及最终的达成情况分析。
          <br/>
          <em>提示：如果需要 AI 辅助分析，您可以将前面生成的成绩数据复制给 DeepSeek 等 AI 助手，然后将生成的分析结果粘贴到此处。</em>
        </p>

        <div className="space-y-6">
          {objectives.map(obj => {
            const evalData = getSubjectiveEval(obj.id);
            return (
              <div key={obj.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-medium text-slate-800">{obj.name}</h3>
                </div>
                <div className="p-4 space-y-4 bg-white">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">主观定性评价达成情况</label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      rows={4}
                      value={evalData.qualitativeEval}
                      onChange={(e) => handleUpdateSubjectiveEval(obj.id, 'qualitativeEval', e.target.value)}
                      placeholder="例如：结课座谈会 150 人中有 16 人表示..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">达成情况分析</label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      rows={4}
                      value={evalData.analysis}
                      onChange={(e) => handleUpdateSubjectiveEval(obj.id, 'analysis', e.target.value)}
                      placeholder="例如：本课程目标由期末考试、MOOC 构成，从期末考试达成度可以看出..."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 持续改进情况 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">课程目标达成持续改进情况</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">上一年度的提出的改进意见</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={5}
              value={continuousImprovement.previousFeedback}
              onChange={(e) => setContinuousImprovement({ ...continuousImprovement, previousFeedback: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">本年度的改进实施效果</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={5}
              value={continuousImprovement.currentEffect}
              onChange={(e) => setContinuousImprovement({ ...continuousImprovement, currentEffect: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">本年度的问题</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={5}
              value={continuousImprovement.currentProblems}
              onChange={(e) => setContinuousImprovement({ ...continuousImprovement, currentProblems: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">拟在下一年度的改进措施</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={5}
              value={continuousImprovement.futureMeasures}
              onChange={(e) => setContinuousImprovement({ ...continuousImprovement, futureMeasures: e.target.value })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
