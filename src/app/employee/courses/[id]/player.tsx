'use client';

import { useState } from 'react';
import { markModuleComplete } from './actions';
import styles from './player.module.css';

export default function CoursePlayer({ enrollment }: { enrollment: any }) {
    const { course, moduleProgress } = enrollment;
    const [activeModule, setActiveModule] = useState(course.modules[0]);

    const isCompleted = (moduleId: string) => {
        return moduleProgress.some((p: any) => p.moduleId === moduleId && p.completed);
    };

    const handleComplete = async () => {
        await markModuleComplete(course.id, activeModule.id);
        // Optimistically update UI or wait for revalidate
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <h2 className={styles.courseTitle}>{course.title}</h2>
                <div className={styles.moduleList}>
                    {course.modules.map((module: any) => (
                        <button
                            key={module.id}
                            className={`${styles.moduleItem} ${activeModule.id === module.id ? styles.active : ''}`}
                            onClick={() => setActiveModule(module)}
                        >
                            <div className={styles.moduleStatus}>
                                {isCompleted(module.id) ? '✓' : '○'}
                            </div>
                            <div className={styles.moduleInfo}>
                                <span className={styles.moduleType}>{module.type}</span>
                                <span className={styles.moduleName}>{module.title}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.contentHeader}>
                    <h1>{activeModule.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {!isCompleted(activeModule.id) && (
                            <button onClick={handleComplete} className="btn btn-primary">
                                Mark as Complete
                            </button>
                        )}
                        {enrollment.progress === 100 && (
                            <a href={`/employee/certificates/${enrollment.id}`} className="btn btn-primary" style={{ backgroundColor: '#059669' }}>
                                View Certificate
                            </a>
                        )}
                    </div>
                </div>

                <div className={styles.contentBody}>
                    {activeModule.type === 'VIDEO' && (
                        <div className={styles.videoPlaceholder}>
                            {activeModule.contentUrl ? (
                                <iframe
                                    src={activeModule.contentUrl}
'use client';

                            import {useState} from 'react';
                            import {markModuleComplete} from './actions';
                            import styles from './player.module.css';

                            export default function CoursePlayer({enrollment}: {enrollment: any }) {
    const {course, moduleProgress} = enrollment;
                            const [activeModule, setActiveModule] = useState(course.modules[0]);

    const isCompleted = (moduleId: string) => {
        return moduleProgress.some((p: any) => p.moduleId === moduleId && p.completed);
    };

    const handleComplete = async () => {
                                await markModuleComplete(course.id, activeModule.id);
        // Optimistically update UI or wait for revalidate
    };

                            return (
                            <div className={styles.container}>
                                <div className={styles.sidebar}>
                                    <h2 className={styles.courseTitle}>{course.title}</h2>
                                    <div className={styles.moduleList}>
                                        {course.modules.map((module: any) => (
                                            <button
                                                key={module.id}
                                                className={`${styles.moduleItem} ${activeModule.id === module.id ? styles.active : ''}`}
                                                onClick={() => setActiveModule(module)}
                                            >
                                                <div className={styles.moduleStatus}>
                                                    {isCompleted(module.id) ? '✓' : '○'}
                                                </div>
                                                <div className={styles.moduleInfo}>
                                                    <span className={styles.moduleType}>{module.type}</span>
                                                    <span className={styles.moduleName}>{module.title}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.content}>
                                    <div className={styles.contentHeader}>
                                        <h1>{activeModule.title}</h1>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            {!isCompleted(activeModule.id) && (
                                                <button onClick={handleComplete} className="btn btn-primary">
                                                    Mark as Complete
                                                </button>
                                            )}
                                            {enrollment.progress === 100 && (
                                                <a href={`/employee/certificates/${enrollment.id}`} className="btn btn-primary" style={{ backgroundColor: '#059669' }}>
                                                    View Certificate
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.contentBody}>
                                        {activeModule.type === 'VIDEO' && (
                                            <div className={styles.videoPlaceholder}>
                                                {activeModule.contentUrl ? (
                                                    <iframe
                                                        src={activeModule.contentUrl}
                                                        width="100%"
                                                        height="100%"
                                                        frameBorder="0"
                                                        allowFullScreen
                                                    ></iframe>
                                                ) : (
                                                    <p>No video URL provided</p>
                                                )}
                                            </div>
                                        )}

                                        {activeModule.type === 'PDF' && (
                                            <div className={styles.documentPlaceholder}>
                                                <a href={activeModule.contentUrl} target="_blank" rel="noopener noreferrer" className="btn">
                                                    Download / View PDF
                                                </a>
                                            </div>
                                        )}

                                        {activeModule.type === 'QUIZ' && (
                                            <div className={styles.documentPlaceholder}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ marginBottom: '1rem' }}>This module contains a quiz.</p>
                                                    <a href={`/employee/courses/${course.id}/quiz/${activeModule.id}`} className="btn btn-primary">
                                                        Start Quiz
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        <div className={styles.description}>
                                            <h3>Description</h3>
                                            <p>{activeModule.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
}
