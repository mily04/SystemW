import React from 'react';
import { Objective, Assessment, Mapping } from '../types';

interface Props {
  objectives: Objective[];
  assessments: Assessment[];
  mappings: Mapping[];
  setMappings: (mappings: Mapping[]) => void;
}

export default function MappingTab({ objectives, assessments, mappings, setMappings }: Props) {
  const getMapping = (objId: string, asmId: string) => {
    return mappings.find(m => m.objectiveId === objId && m.assessmentId === asmId);
  };

  const handleToggleMapping = (objId: string, asmId: string, checked: boolean) => {
    if (checked) {
      setMappings([...mappings, { objectiveId: objId, assessmentId: asmId, weight: 0, targetScore: 100 }]);
    } else {
      setMappings(mappings.filter(m => !(m.objectiveId === objId && m.assessmentId === asmId)));
    }
  };

  const handleUpdateMapping = (objId: string, asmId: string, field: 'weight' | 'targetScore', value: number) => {
    setMappings(mappings.map(m => {
      if (m.objectiveId === objId && m.assessmentId === asmId) {
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">课程目标达成途径设置 (权重与满分)</h2>
        <p className="text-slate-500 text-sm">
          请勾选每个课程目标对应的考核方式，并设置该考核方式在目标中的权重（权重之和应为1）以及该考核方式的满分值。
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="py-3 px-4 font-medium text-slate-700 w-32 border-r border-slate-200">课程目标</th>
              {assessments.map(asm => (
                <th key={asm.id} className="py-3 px-4 font-medium text-slate-700 min-w-[200px] border-r border-slate-200 last:border-r-0 text-center">
                  {asm.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objectives.map(obj => {
              // Calculate total weight for this objective
              const totalWeight = assessments.reduce((sum, asm) => {
                const m = getMapping(obj.id, asm.id);
                return sum + (m ? m.weight : 0);
              }, 0);
              const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

              return (
                <tr key={obj.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 border-r border-slate-200 align-top">
                    <div className="font-medium text-slate-800">{obj.name}</div>
                    <div className={`text-xs mt-2 ${isWeightValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      总权重: {totalWeight.toFixed(2)}
                      {!isWeightValid && ' (需为1.0)'}
                    </div>
                  </td>
                  {assessments.map(asm => {
                    const mapping = getMapping(obj.id, asm.id);
                    const isEnabled = !!mapping;

                    return (
                      <td key={asm.id} className="py-4 px-4 border-r border-slate-200 last:border-r-0 align-top">
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                              checked={isEnabled}
                              onChange={(e) => handleToggleMapping(obj.id, asm.id, e.target.checked)}
                            />
                            <span className="text-sm font-medium text-slate-700">启用此考核</span>
                          </label>

                          {isEnabled && (
                            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">权重 (0~1)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  value={mapping.weight}
                                  onChange={(e) => handleUpdateMapping(obj.id, asm.id, 'weight', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">满分值</label>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  value={mapping.targetScore}
                                  onChange={(e) => handleUpdateMapping(obj.id, asm.id, 'targetScore', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {objectives.length === 0 && (
              <tr>
                <td colSpan={assessments.length + 1} className="py-8 text-center text-slate-500">
                  请先在“基础设置”中添加课程目标和考核方式。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
