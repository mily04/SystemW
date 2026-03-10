import React from 'react';
import { CourseInfo, Objective, Assessment, GradReq } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  courseInfo: CourseInfo;
  setCourseInfo: (info: CourseInfo) => void;
  objectives: Objective[];
  setObjectives: (objs: Objective[]) => void;
  assessments: Assessment[];
  setAssessments: (asms: Assessment[]) => void;
  gradReqs: GradReq[];
  setGradReqs: (reqs: GradReq[]) => void;
}

export default function SetupTab({ courseInfo, setCourseInfo, objectives, setObjectives, assessments, setAssessments, gradReqs, setGradReqs }: Props) {
  const handleAddObjective = () => {
    const newId = `obj${Date.now()}`;
    setObjectives([...objectives, { id: newId, name: `Obj ${objectives.length + 1}`, description: '' }]);
    // Also add a default grad req mapping
    setGradReqs([...gradReqs, { objectiveId: newId, indicator: `Req 1.1`, weight: 0.3 }]);
  };

  const handleRemoveObjective = (id: string) => {
    setObjectives(objectives.filter(o => o.id !== id));
    setGradReqs(gradReqs.filter(r => r.objectiveId !== id));
  };

  const handleAddAssessment = () => {
    const newId = `asm${Date.now()}`;
    setAssessments([...assessments, { id: newId, name: `考核方式 ${assessments.length + 1}` }]);
  };

  const handleRemoveAssessment = (id: string) => {
    setAssessments(assessments.filter(a => a.id !== id));
  };

  const handleUpdateGradReq = (objectiveId: string, field: 'indicator' | 'weight', value: any) => {
    const existing = gradReqs.find(r => r.objectiveId === objectiveId);
    if (existing) {
      setGradReqs(gradReqs.map(r => r.objectiveId === objectiveId ? { ...r, [field]: value } : r));
    } else {
      setGradReqs([...gradReqs, { objectiveId, indicator: '', weight: 0, [field]: value }]);
    }
  };

  const getGradReq = (objectiveId: string) => {
    return gradReqs.find(r => r.objectiveId === objectiveId) || { objectiveId, indicator: '', weight: 0 };
  };

  return (
    <div className="space-y-8">
      {/* 课程基本信息 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">课程基本情况</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">课程名称</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={courseInfo.courseName}
              onChange={(e) => setCourseInfo({ ...courseInfo, courseName: e.target.value })}
              placeholder="例如：单片机原理及接口技术"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">授课学期</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={courseInfo.term}
              onChange={(e) => setCourseInfo({ ...courseInfo, term: e.target.value })}
              placeholder="例如：2024 年（秋）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">授课对象</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={courseInfo.targetStudents}
              onChange={(e) => setCourseInfo({ ...courseInfo, targetStudents: e.target.value })}
              placeholder="例如：自动化 221-225"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">任课教师</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={courseInfo.teacher}
              onChange={(e) => setCourseInfo({ ...courseInfo, teacher: e.target.value })}
              placeholder="例如：郭栋"
            />
          </div>
        </div>
      </section>

      {/* 课程目标设置 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">课程目标设置</h2>
          <button
            onClick={handleAddObjective}
            className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1" /> 添加目标
          </button>
        </div>
        <div className="space-y-3">
          {objectives.map((obj, index) => {
            const req = getGradReq(obj.id);
            return (
              <div key={obj.id} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex gap-3 items-start">
                  <div className="w-24 shrink-0">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={obj.name}
                      onChange={(e) => {
                        const newObjs = [...objectives];
                        newObjs[index].name = e.target.value;
                        setObjectives(newObjs);
                      }}
                      placeholder="如: Obj 1"
                    />
                  </div>
                  <div className="flex-1">
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      rows={2}
                      value={obj.description}
                      onChange={(e) => {
                        const newObjs = [...objectives];
                        newObjs[index].description = e.target.value;
                        setObjectives(newObjs);
                      }}
                      placeholder="课程目标具体内容..."
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveObjective(obj.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除目标"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-4 items-center pl-27">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap">支撑毕业要求指标点</label>
                    <input
                      type="text"
                      className="w-32 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      value={req.indicator}
                      onChange={(e) => handleUpdateGradReq(obj.id, 'indicator', e.target.value)}
                      placeholder="如: Req 1.3"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 whitespace-nowrap">权重</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-24 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      value={req.weight}
                      onChange={(e) => handleUpdateGradReq(obj.id, 'weight', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {objectives.length === 0 && (
            <div className="text-center py-6 text-slate-500">暂无课程目标，请点击右上角添加。</div>
          )}
        </div>
      </section>

      {/* 考核方式设置 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">考核方式设置</h2>
          <button
            onClick={handleAddAssessment}
            className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1" /> 添加考核方式
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {assessments.map((asm, index) => (
            <div key={asm.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <input
                type="text"
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={asm.name}
                onChange={(e) => {
                  const newAsms = [...assessments];
                  newAsms[index].name = e.target.value;
                  setAssessments(newAsms);
                }}
                placeholder="如: 期末考试"
              />
              <button
                onClick={() => handleRemoveAssessment(asm.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="删除考核方式"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {assessments.length === 0 && (
            <div className="col-span-full text-center py-6 text-slate-500">暂无考核方式，请点击右上角添加。</div>
          )}
        </div>
      </section>
    </div>
  );
}
