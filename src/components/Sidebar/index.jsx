import React from "react"
import { observer } from "mobx-react"
import { useMst } from "models/RootStore"
import styles from "./styles.styl"
import Logo from "assets/logo.svg"
import classNames from "classnames"
import LetterIcon from "assets/letter.svg"
import TodayIcon from "assets/today.svg"
import ArrowRightIcon from "assets/arrow_right.svg"
import FolderIcon from "assets/folder.svg"
import PlusIcon from "assets/plus.svg"
import propTypes from "prop-types"
import { useContextMenu, useInput } from "tools/hooks"

const Element = ({ active, onClick, icon, text, deletable, onDelete }) => {
  const Icon = icon
  const ref = React.useRef(null)
  if (deletable)
    useContextMenu(ref, [{ label: "Delete", click: () => onDelete() }])
  return (
    <div
      ref={ref}
      className={classNames({
        [styles.groupElement]: true,
        [styles.active]: active,
      })}
      onClick={onClick}
    >
      <Icon className={styles.groupElementIcon} />
      {text}
    </div>
  )
}

Element.propTypes = {
  active: propTypes.bool,
  onClick: propTypes.func,
  icon: propTypes.any,
  text: propTypes.string,
  deletable: propTypes.bool,
  onDelete: propTypes.func,
}

const Group = observer(
  ({ name, elements, isActive, onElementClick, onAdd, onDelete }) => {
    const [isOpen, setIsOpen] = React.useState(true)
    const [isAddActive, setIsAddActive] = React.useState(false)
    const [newName, setNewName] = React.useState("")
    if (!isActive) isActive = () => {}
    const addTriggerRef = React.useRef(null)
    const addInputRef = React.useRef(null)

    React.useEffect(() => {
      console.log(isAddActive)
      if (isAddActive) addInputRef.current.focus()
    }, [isAddActive])

    const onTitleClick = e => {
      if (
        addTriggerRef.current &&
        (e.target === addTriggerRef.current ||
          addTriggerRef.current.contains(e.target))
      )
        return
      setIsOpen(!isOpen)
    }

    useInput(addInputRef, e => {
      if (e.code === "Enter") {
        onAdd(newName)
        setNewName("")
        setIsAddActive(false)
      }
    })

    const onAddClick = () => {
      setNewName("")
      setIsAddActive(!isAddActive)
    }

    return (
      <div>
        <div className={styles.groupTitle} onClick={onTitleClick}>
          <ArrowRightIcon
            className={classNames({
              [styles.groupTitleIcon]: true,
              [styles.groupTitleIconOpen]: isOpen,
            })}
          />
          {name}
          <div
            className={styles.addTrigger}
            ref={addTriggerRef}
            onClick={onAddClick}
          >
            <PlusIcon />
          </div>
        </div>
        {isAddActive && (
          <div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className={styles.newName}
              placeholder={"Имя"}
              ref={addInputRef}
            />
          </div>
        )}
        {isOpen &&
          elements.map(project => (
            <Element
              key={`project_${project.id}`}
              text={project.name}
              icon={FolderIcon}
              active={isActive(project)}
              onClick={onElementClick(project)}
              deletable={!!onDelete}
              onDelete={() => onDelete(project)}
            />
          ))}
      </div>
    )
  },
)

Group.propTypes = {
  name: propTypes.string,
  elements: propTypes.any,
  isActive: propTypes.func,
  onElementClick: propTypes.func,
  onAdd: propTypes.func,
}

const Sidebar = observer(() => {
  const {
    tasks: { all, deleteTask },
    screen,
    setScreen,
    projects,
    tags,
    selectedProject,
    selectProject,
    selectedTag,
    selectTag,
    createProject,
    createTag,
    deleteProject,
    deleteTag,
  } = useMst()

  const addTag = name => {
    selectTag(createTag(name))
    setScreen("TAG")
  }

  const addProject = name => {
    selectProject(createProject(name))
    setScreen("PROJECT")
  }

  const rmProject = project => {
    console.log("DELETE PROJECT", project.toJSON())
    all.forEach(task => {
      if (task.project !== project) return
      deleteTask(task)
    })
    deleteProject(project)
  }

  const rmTag = tag => {
    console.log("DELETE TAG", tag.toJSON())
    all.forEach(task => task.removeTag(tag))
    deleteTag(tag)
  }

  return (
    <div>
      <div className={styles.logoWrapper}>
        <Logo className={styles.logo} />
        <span className={styles.logoTitle}>Task</span>
      </div>
      <div
        className={classNames({
          [styles.groupElement]: true,
          [styles.active]: screen === "INBOX",
        })}
        onClick={() => setScreen("INBOX")}
      >
        <LetterIcon className={styles.groupElementIcon} />
        Входящие
      </div>
      <div
        className={classNames({
          [styles.groupElement]: true,
          [styles.active]: screen === "TODAY",
        })}
        onClick={() => setScreen("TODAY")}
      >
        <TodayIcon className={styles.groupElementIcon} />
        Сегодня
      </div>
      <div
        className={classNames({
          [styles.groupElement]: true,
          [styles.active]: screen === "LOG",
        })}
        onClick={() => setScreen("LOG")}
      >
        <FolderIcon className={styles.groupElementIcon} />
        Журнал
      </div>

      <Group
        name={"Проекты"}
        elements={projects}
        isActive={project =>
          project === selectedProject && screen === "PROJECT"
        }
        onElementClick={project => {
          return () => {
            setScreen("PROJECT")
            selectProject(project)
          }
        }}
        onAdd={addProject}
        onDelete={rmProject}
      />
      <Group
        name={"Тэги"}
        elements={tags}
        onElementClick={tag => {
          return () => {
            selectTag(tag)
            setScreen("TAG")
          }
        }}
        isActive={tag => screen === "TAG" && tag.id === selectedTag.id}
        onAdd={addTag}
        onDelete={rmTag}
      />
    </div>
  )
})

export default Sidebar
