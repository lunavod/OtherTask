import { types, destroy } from "mobx-state-tree"
import { createContext, useContext } from "react"
import TaskList from "./TaskList"
import Task, { factory as taskFactory } from "./Task"
import Project from "./Project"
import Tag, { randomTagColor } from "./Tag"
import TimelineEvent from "./TimelineEvent"
import moment from "moment"
import { v4 as uuidv4 } from "uuid"

const RootStore = types
  .model("Store", {
    tempTask: types.maybeNull(Task),
    events: types.array(TimelineEvent),
    tasks: TaskList,
    projects: types.array(Project),
    selectedDate: moment().format("YYYY-MM-DD"),
    timelineDate: moment().format("YYYY-MM-DD"),
    screen: types.optional(
      types.enumeration(["INBOX", "TODAY", "PROJECT", "LOG", "TAGS"]),
      "TODAY",
    ),
    selectedProject: types.maybeNull(types.reference(Project)),
    tags: types.array(Tag),
    selectedTag: types.maybeNull(types.reference(Tag)),
    selectedTagType: types.optional(
      types.enumeration(["TASK", "EVENT"]),
      "TASK",
    ),
    _storeVersion: types.optional(types.number, 0),
    sidebarWidth: types.optional(types.number, 250),
    timelineWidth: types.optional(types.number, 350),
  })
  .actions(self => ({
    selectTagType(type) {
      self.selectedTagType = type
    },
    setSidebarWidth(val) {
      self.sidebarWidth = val
    },
    setTimelineWidth(val) {
      self.timelineWidth = val
    },
    insertTempTask() {
      const task = JSON.parse(JSON.stringify(self.tempTask.toJSON()))
      task.id = uuidv4()
      self.tasks.add(task)
      if (self.tempTask.event) {
        self.tempTask.event.task = task.id
      }
      self.tempTask = null
    },
    setTempTask(task) {
      if (self.tempTask && self.tempTask.event) {
        this.deleteEvent(self.tempTask.event)
      }
      self.tempTask = task
    },
    setTimelineDate(val) {
      if (typeof val !== "string") {
        val = moment(val).format("YYYY-MM-DD")
      }
      self.timelineDate = val
    },
    createTask(data = {}) {
      const newId = uuidv4()
      return Task.create(taskFactory(newId, data))
    },
    createProject(name) {
      const newId = uuidv4()
      const maxIndex = self.projects.reduce(
        (max, project) => (project.index > max ? project.index : max),
        0,
      )
      const project = Project.create({ id: newId, name, index: maxIndex + 1 })
      self.projects.push(project)
      return project
    },
    createTag(name, type) {
      const newId = uuidv4()
      let lastIndex = -1
      self.tags.forEach(tag => {
        if (tag.type !== type) return
        if (tag.index > lastIndex) lastIndex = tag.index
      })
      const tag = Tag.create({
        id: newId,
        name,
        index: lastIndex + 1,
        color: randomTagColor(),
        type: type || "TASK",
      })
      self.tags.push(tag)
      return tag
    },
    createEvent(data) {
      const newId = uuidv4()
      self.events.push({
        ...data,
        id: newId,
      })
      return newId
    },
    selectDate(date) {
      self.selectedDate = moment(date).format("YYYY-MM-DD")
    },
    setScreen(screen) {
      self.screen = screen
      self.tasks.selected = null
      self.tempTask = null
      self.selectedDate = moment().format("YYYY-MM-DD")
    },
    selectProject(project) {
      self.selectedProject = project
    },
    selectTag(tag) {
      self.selectedTag = tag
    },
    deleteTag(tag) {
      if (self.selectedTag === tag) {
        self.selectedTag = null
        if (self.screen === "TAG") self.screen = "INBOX"
      }
      destroy(tag)
    },
    deleteProject(project) {
      if (self.selectedProject === project) {
        self.selectedProject = null
        if (self.screen === "PROJECT") self.screen = "INBOX"
      }
      destroy(project)
    },
    deleteEvent(event, force = false) {
      if (event.task && !force) {
        return event.task.unconnectEvent()
      }
      destroy(event)
    },
    applyMigration() {},
    removeAllEvents() {
      self.events = []
    },
  }))

export default RootStore

const RootStoreContext = createContext(null)
export const Provider = RootStoreContext.Provider

export function useMst() {
  const store = useContext(RootStoreContext)
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider")
  }
  return store
}
