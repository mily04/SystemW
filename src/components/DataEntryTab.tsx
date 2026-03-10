import React, { useState, useRef } from 'react';
import { Objective, Assessment, Mapping, Student } from '../types';
import { Plus, Trash2, Upload, Download } from 'lucide-react';

interface Props {
  objectives: Objective[];
  assessments: Assessment[];
  mappings: Mapping[];
  students: Student[];
  setStudents: (students: Student[]) => void;
}

export default function DataEntryTab({ objectives, assessments, mappings, students, setStudents }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter out active mappings
  const activeMappings = mappings.filter(m => m.weight > 0);

  const handleAddStudent = () => {
    const newId = `stu${Date.now()}`;
    setStudents([...students, { id: newId, studentId: `2024${students.length + 1}`, name: `学生 ${students.length + 1}`, scores: {} }]);
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleUpdateScore = (studentId: string, mappingKey: string, score: number) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return { ...s, scores: { ...s.scores, [mappingKey]: score } };
      }
      return s;
    }));
  };

  const handleUpdateStudentInfo = (studentId: string, field: 'studentId' | 'name', value: string) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) return; // Need header and at least one row

      const headers = lines[0].split(',');
      
      const newStudents: Student[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < 2) continue;

        const stuId = cols[0].trim();
        const stuName = cols[1].trim();
        const scores: Record<string, number> = {};

        // Try to match headers with active mappings
        for (let j = 2; j < cols.length; j++) {
          const header = headers[j]?.trim();
          if (!header) continue;

          // Expected header format: "ObjName-AssessmentName"
          const mapping = activeMappings.find(m => {
            const obj = objectives.find(o => o.id === m.objectiveId);
            const asm = assessments.find(a => a.id === m.assessmentId);
            return `${obj?.name}-${asm?.name}` === header;
          });

          if (mapping) {
            const scoreVal = parseFloat(cols[j]);
            if (!isNaN(scoreVal)) {
              scores[`${mapping.objectiveId}_${mapping.assessmentId}`] = scoreVal;
            }
          }
        }

        newStudents.push({
          id: `stu_${Date.now()}_${i}`,
          studentId: stuId,
          name: stuName,
          scores
        });
      }

      if (newStudents.length > 0) {
        setStudents(newStudents);
        setImportMessage(`成功导入 ${newStudents.length} 名学生成绩！`);
        setTimeout(() => setImportMessage(null), 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportTemplate = () => {
    const headers = ['学号', '姓名'];
    activeMappings.forEach(m => {
      const obj = objectives.find(o => o.id === m.objectiveId);
      const asm = assessments.find(a => a.id === m.assessmentId);
      if (obj && asm) {
        headers.push(`${obj.name}-${asm.name}`);
      }
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + '2024001,张三,' + activeMappings.map(() => '0').join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '成绩导入模板.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">成绩录入</h2>
          <p className="text-slate-500 text-sm">
            手动输入学生成绩或通过 CSV 文件批量导入。
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {importMessage && (
            <span className="text-emerald-600 text-sm font-medium mr-2 animate-in fade-in">
              {importMessage}
            </span>
          )}
          <button
            onClick={handleExportTemplate}
            className="flex items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4 mr-1.5" /> 下载模板
          </button>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImportCSV}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4 mr-1.5" /> 导入成绩
          </button>

          <button
            onClick={handleAddStudent}
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> 添加学生
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3 px-4 font-medium text-slate-700 w-16 text-center border-r border-slate-200">序号</th>
              <th className="py-3 px-4 font-medium text-slate-700 w-32 border-r border-slate-200">学号</th>
              <th className="py-3 px-4 font-medium text-slate-700 w-32 border-r border-slate-200">姓名</th>
              {activeMappings.map(m => {
                const obj = objectives.find(o => o.id === m.objectiveId);
                const asm = assessments.find(a => a.id === m.assessmentId);
                return (
                  <th key={`${m.objectiveId}_${m.assessmentId}`} className="py-3 px-4 font-medium text-slate-700 border-r border-slate-200 text-center min-w-[120px]">
                    <div className="text-sm">{obj?.name} - {asm?.name}</div>
                    <div className="text-xs text-slate-500 font-normal mt-1">满分: {m.targetScore}</div>
                  </th>
                );
              })}
              <th className="py-3 px-4 font-medium text-slate-700 w-16 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                <td className="py-2 px-4 border-r border-slate-200 text-center text-slate-500">{index + 1}</td>
                <td className="py-2 px-4 border-r border-slate-200">
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded focus:ring-1 focus:ring-indigo-500 bg-transparent focus:bg-white transition-all"
                    value={student.studentId}
                    onChange={(e) => handleUpdateStudentInfo(student.id, 'studentId', e.target.value)}
                  />
                </td>
                <td className="py-2 px-4 border-r border-slate-200">
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded focus:ring-1 focus:ring-indigo-500 bg-transparent focus:bg-white transition-all"
                    value={student.name}
                    onChange={(e) => handleUpdateStudentInfo(student.id, 'name', e.target.value)}
                  />
                </td>
                {activeMappings.map(m => {
                  const key = `${m.objectiveId}_${m.assessmentId}`;
                  const score = student.scores[key] !== undefined ? student.scores[key] : '';
                  return (
                    <td key={key} className="py-2 px-4 border-r border-slate-200">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={m.targetScore}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded focus:ring-1 focus:ring-indigo-500 bg-transparent focus:bg-white transition-all text-center"
                        value={score}
                        onChange={(e) => handleUpdateScore(student.id, key, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-4 text-center">
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                    title="删除学生"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={activeMappings.length + 4} className="py-12 text-center text-slate-500">
                  暂无学生数据，请手动添加或导入 CSV。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
